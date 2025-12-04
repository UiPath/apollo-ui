import styled from "@emotion/styled";

export const GroupContainer = styled.div<{
  backgroundColor?: string;
  borderColor?: string;
  selected?: boolean;
  collapsed?: boolean;
}>`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: ${({ backgroundColor }) => backgroundColor || "var(--uix-canvas-background-raised)"} !important;
  border: 2px solid ${({ borderColor, selected }) => (selected ? "var(--uix-canvas-primary)" : borderColor || "var(--uix-canvas-border)")} !important;
  border-radius: 16px !important;
  transition: border-color 0.2s ease;
  overflow: visible;
  box-shadow: ${({ selected }) => (selected ? "0 0 0 1px var(--uix-canvas-primary)" : "none")};
  padding: 0 !important;

  &:hover {
    border-color: ${({ selected }) => (selected ? "var(--uix-canvas-primary)" : "var(--uix-canvas-border-hover)")} !important;
  }
`;

export const GroupHeader = styled.div`
  position: absolute;
  top: -14px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px;
  background: var(--uix-canvas-background);
  border: 1px solid var(--uix-canvas-border-grid);
  border-radius: 8px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.04);
  pointer-events: auto;
  z-index: 10;
`;

export const GroupIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: default;

  svg {
    color: var(--uix-canvas-foreground);
  }
`;

export const GroupTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--uix-canvas-foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  padding: 0 8px;
  line-height: 24px;
`;

export const GroupControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0px;
`;

export const GroupHeaderButton = styled.button<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
  transition: all 0.15s ease;
  pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};

  &:hover:not(:disabled) {
    background: var(--uix-canvas-background-secondary);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  svg {
    color: var(--uix-canvas-foreground);
  }
`;

export const GroupHeaderSeparator = styled.div`
  width: 1px;
  height: 20px;
  background: var(--uix-canvas-border-grid);
  align-self: center;
`;

export const GroupContent = styled.div<{ collapsed?: boolean }>`
  width: 100%;
  height: 100%;
  padding: 16px;
  display: ${({ collapsed }) => (collapsed ? "none" : "block")};
`;

export const ResizeHandle = styled.div<{ selected?: boolean; cursor?: string }>`
  position: absolute;
  right: 0;
  bottom: 0;
  width: 20px;
  height: 20px;
  cursor: ${({ cursor }) => cursor || "nwse-resize"};
  opacity: ${({ selected }) => (selected ? 1 : 0)};
  transition: opacity 0.2s ease;
  z-index: 10;
  pointer-events: auto;
`;

export const TopCornerIndicators = styled.div<{ selected?: boolean }>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: ${({ selected }) => (selected ? 1 : 0)};
  transition: opacity 0.2s ease;

  /* Top-left corner */
  &::before {
    content: "";
    position: absolute;
    top: -5px;
    left: -5px;
    width: 6px;
    height: 6px;
    background: var(--uix-canvas-background);
    border: 1px solid var(--uix-canvas-primary);
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
    background: var(--uix-canvas-background);
    border: 1px solid var(--uix-canvas-primary);
    border-radius: 1px;
  }
`;

export const BottomCornerIndicators = styled.div<{ selected?: boolean }>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: ${({ selected }) => (selected ? 1 : 0)};
  transition: opacity 0.2s ease;

  /* Bottom-left corner */
  &::before {
    content: "";
    position: absolute;
    bottom: -5px;
    left: -5px;
    width: 6px;
    height: 6px;
    background: var(--uix-canvas-background);
    border: 1px solid var(--uix-canvas-primary);
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
    background: var(--uix-canvas-background);
    border: 1px solid var(--uix-canvas-primary);
    border-radius: 1px;
  }
`;
