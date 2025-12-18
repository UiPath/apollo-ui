import styled from "@emotion/styled";
import { motion } from "motion/react";

export const StyledToolbarContainer = styled(motion.div, {
  shouldForwardProp: (prop: string) => !prop.startsWith("$"),
})<{
  $position: "top" | "bottom" | "left" | "right";
  $align?: "start" | "center" | "end";
}>`
  position: absolute;
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

  ${({ $position, $align = "center" }) => {
    switch ($position) {
      case "top":
        switch ($align) {
          case "start":
            return `
              top: -40px;
              left: 0;
              flex-direction: row;
            `;
          case "end":
            return `
              top: -40px;
              right: 0;
              flex-direction: row;
            `;
          case "center":
          default:
            return `
              top: -40px;
              left: 0;
              right: 0;
              margin: 0 auto;
              width: fit-content;
              flex-direction: row;
            `;
        }
      case "bottom":
        switch ($align) {
          case "start":
            return `
              bottom: -40px;
              left: 0;
              flex-direction: row;
            `;
          case "end":
            return `
              bottom: -40px;
              right: 0;
              flex-direction: row;
            `;
          case "center":
          default:
            return `
              bottom: -40px;
              left: 0;
              right: 0;
              margin: 0 auto;
              width: fit-content;
              flex-direction: row;
            `;
        }
      case "left":
        switch ($align) {
          case "start":
            return `
              left: -40px;
              top: 0;
              flex-direction: column;
            `;
          case "end":
            return `
              left: -40px;
              bottom: 0;
              flex-direction: column;
            `;
          case "center":
          default:
            return `
              left: -40px;
              top: 0;
              bottom: 0;
              margin: auto 0;
              height: fit-content;
              flex-direction: column;
            `;
        }
      case "right":
        switch ($align) {
          case "start":
            return `
              right: -40px;
              top: 0;
              flex-direction: column;
            `;
          case "end":
            return `
              right: -40px;
              bottom: 0;
              flex-direction: column;
            `;
          case "center":
          default:
            return `
              right: -40px;
              top: 0;
              bottom: 0;
              margin: auto 0;
              height: fit-content;
              flex-direction: column;
            `;
        }
    }
  }}
`;

export const StyledToolbarSeparator = styled.div<{ $orientation: "horizontal" | "vertical" }>`
  width: ${({ $orientation }) => ($orientation === "vertical" ? "1px" : "calc(100%)")};
  height: ${({ $orientation }) => ($orientation === "horizontal" ? "1px" : "20px")};
  background: var(--uix-canvas-border-grid);
  align-self: center;
`;

export const StyledDropdownMenu = styled(motion.div)`
  position: absolute;
  top: -2px;
  left: calc(100% + 4px);
  min-width: 180px;
  background: var(--uix-canvas-background);
  border: 1px solid var(--uix-canvas-border-subtle);
  border-radius: 6px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.04);
  padding: 4px;
  z-index: 1000;
  pointer-events: auto;
`;

export const StyledDropdownItem = styled.button<{
  $disabled?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
  transition: background 0.15s ease;
  font-size: 14px;
  color: var(--uix-canvas-foreground);
  text-align: left;
  pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};

  &:hover:not(:disabled) {
    background: var(--uix-canvas-background-secondary);
  }

  svg {
    flex-shrink: 0;
    color: var(--uix-canvas-foreground);
  }

  span {
    flex: 1;
    color: var(--uix-canvas-foreground);
  }
`;

export const StyledOverflowContainer = styled.div`
  position: relative;
`;

export const StyledToolbarButton = styled(motion.button, {
  shouldForwardProp: (prop: string) => !prop.startsWith("$"),
})<{
  $disabled?: boolean;
  $isToggled?: boolean;
  $color?: string;
  $hoverColor?: string;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: ${({ $isToggled, $hoverColor }) =>
    ($isToggled && ($hoverColor || "var(--uix-canvas-background-secondary)")) || "transparent"};
  border: none;
  border-radius: 8px;
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
  transition:
    background 0.15s ease,
    opacity 0.15s ease;
  pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};

  &:hover:not(:disabled) {
    background: ${({ $hoverColor }) => $hoverColor || "var(--uix-canvas-background-secondary)"};
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  svg {
    color: ${({ $color }) => $color || "var(--uix-canvas-foreground)"};
  }
`;
