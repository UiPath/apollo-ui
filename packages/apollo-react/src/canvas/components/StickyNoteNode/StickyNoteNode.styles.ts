import styled from "@emotion/styled";
import { motion } from "motion/react";

export const StickyNoteContainer = styled.div<{
  backgroundColor: string;
  isEditing: boolean;
  selected?: boolean;
}>`
  width: 100%;
  height: 100%;
  background-color: ${(props) => props.backgroundColor};
  border-radius: 16px;
  border: 2px solid ${(props) => (props.selected ? "var(--color-primary)" : "rgba(0, 0, 0, 0.2)")};
  box-shadow: ${(props) => (props.selected ? "0 4px 12px rgba(59, 130, 246, 0.4)" : "0 2px 4px rgba(0, 0, 0, 0.2)")};
  padding: 12px;
  cursor: ${(props) => (props.isEditing ? "text" : "move")};
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    box-shadow: ${(props) => (props.selected ? "0 4px 12px rgba(59, 130, 246, 0.4)" : "0 3px 8px rgba(0, 0, 0, 0.25)")};
  }
`;

export const StickyNoteTextArea = styled.textarea<{ isEditing: boolean }>`
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-primary);
  cursor: ${(props) => (props.isEditing ? "text" : "move")};
  user-select: ${(props) => (props.isEditing ? "text" : "none")};
  pointer-events: ${(props) => (props.isEditing ? "auto" : "none")};
  overflow-y: auto;

  &::placeholder {
    color: var(--color-foreground-de-emp);
    opacity: ${(props) => (props.isEditing ? 1 : 0.6)};
  }

  &:focus {
    user-select: text;
    cursor: text;
  }
`;

export const StickyNoteMarkdown = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-primary);
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
    font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
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

  li {
    margin: 4px 0;
  }

  a {
    color: var(--color-primary);
    text-decoration: underline;
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

  blockquote {
    border-left: 3px solid rgba(0, 0, 0, 0.2);
    padding-left: 12px;
    margin: 8px 0;
    color: var(--color-foreground-de-emp);
  }
`;

export const ResizeHandle = styled.div<{ selected?: boolean; cursor?: string }>`
  position: absolute;
  right: 0;
  bottom: 0;
  width: 20px;
  height: 20px;
  cursor: ${(props) => props.cursor || "nwse-resize"};
  opacity: ${(props) => (props.selected ? 1 : 0)};
  transition: opacity 0.2s ease;
`;

export const CornerIndicators = styled.div<{ selected?: boolean }>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: ${(props) => (props.selected ? 1 : 0)};
  transition: opacity 0.2s ease;

  /* Top-left corner */
  &::before {
    content: "";
    position: absolute;
    top: -5px;
    left: -5px;
    width: 6px;
    height: 6px;
    background: var(--color-background);
    border: 1px solid var(--color-primary);
    border-radius: 1px;
  }

  /* Top-right corner */
  &::after {
    content: "";
    position: absolute;
    top: -5px;
    right: -5px;
    width: 6px;
    height: 6px;
    background: var(--color-background);
    border: 1px solid var(--color-primary);
    border-radius: 1px;
  }
`;

export const BottomCornerIndicators = styled.div<{ selected?: boolean }>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: ${(props) => (props.selected ? 1 : 0)};
  transition: opacity 0.2s ease;

  /* Bottom-left corner */
  &::before {
    content: "";
    position: absolute;
    bottom: -5px;
    left: -5px;
    width: 6px;
    height: 6px;
    background: var(--color-background);
    border: 1px solid var(--color-primary);
    border-radius: 1px;
  }

  /* Bottom-right corner */
  &::after {
    content: "";
    position: absolute;
    bottom: -5px;
    right: -5px;
    width: 6px;
    height: 6px;
    background: var(--color-background);
    border: 1px solid var(--color-primary);
    border-radius: 1px;
  }
`;

export const ColorPickerPanel = styled(motion.div)`
  display: flex;
  gap: 4px;
  padding: 2px;
  background: var(--color-background);
  border: 1px solid var(--color-border-grid);
  border-radius: 8px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.04);
  pointer-events: auto;
`;

export const ColorOption = styled.button<{ color: string; isSelected: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  border: ${(props) => (props.isSelected ? "2px solid var(--color-primary)" : "1px solid rgba(0, 0, 0, 0.2)")};
  cursor: pointer;
  transition: border 0.15s ease;
  padding: 0;

  &:hover {
    opacity: 0.8;
  }

  &:focus {
    outline: none;
    border: 2px solid var(--color-primary);
  }
`;
