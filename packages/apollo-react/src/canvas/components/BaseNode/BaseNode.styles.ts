import styled from "@emotion/styled";
import { css, keyframes } from "@emotion/react";
import type { NodeShape } from "./BaseNode.types";

const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 193, 7, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0);
  }
`;

const getExecutionStateBorder = (executionState?: string) => {
  switch (executionState) {
    case "NotExecuted":
    case "INFO":
      return css`
        border-color: var(--color-border-de-emp);
      `;
    case "InProgress":
      return css`
        border-color: var(--color-info-icon);
        animation: ${pulseAnimation} 2s infinite;
      `;
    case "Completed":
      return css`
        border-color: var(--color-success-icon);
      `;
    case "Paused":
    case "WARNING":
      return css`
        border-color: var(--color-warning-icon);
      `;
    case "Cancelled":
    case "Failed":
    case "Terminated":
    case "ERROR":
    case "CRITICAL":
      return css`
        border-color: var(--color-error-icon);
        animation: ${pulseAnimation} 2s infinite;
      `;
    default:
      return css`
        border-color: var(--color-border-de-emp);
      `;
  }
};

const getInteractionStateBorder = (interactionState?: string) => {
  switch (interactionState) {
    case "hover":
      return css`
        outline: 4px solid var(--color-secondary-focused);
      `;
    case "disabled":
      return css`
        opacity: 0.5;
        cursor: not-allowed;
      `;
    case "drag":
      return css`
        cursor: grabbing;
        opacity: 0.8;
      `;
    default:
      return null;
  }
};

export const BaseContainer = styled.div<{
  selected?: boolean;
  backgroundColor?: string;
  shape?: NodeShape;
  executionState?: string;
  interactionState?: string;
  width?: number;
  height?: number;
}>`
  position: relative;
  width: ${({ shape, width }) => {
    if (width) return `${width}px`;
    return shape === "rectangle" ? "288px" : "96px";
  }};
  height: ${({ height }) => (height ? `${height}px` : "96px")};
  background: ${({ backgroundColor }) => backgroundColor || "var(--color-background)"};
  border: 1.5px solid var(--color-border-de-emp);
  border-radius: ${({ shape }) => {
    if (shape === "circle") return "50%";
    if (shape === "rectangle") return "16px";
    return "calc(0.5 * 100% / (1.75))";
  }};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: ${({ shape }) => (shape === "rectangle" ? "row" : "column")};
  align-items: center;
  justify-content: ${({ shape }) => (shape === "rectangle" ? "flex-start" : "center")};
  gap: ${({ shape }) => (shape === "rectangle" ? "12px" : "0")};
  padding: ${({ shape, height }) => {
    if (shape === "rectangle") {
      const scaleFactor = height ? height / 100 : 1;
      return `${14 * scaleFactor}px`;
    }
    return "0";
  }};
  cursor: pointer;

  ${({ executionState }) => getExecutionStateBorder(executionState)}
  ${({ interactionState }) => getInteractionStateBorder(interactionState)}

  ${({ selected }) =>
    selected &&
    css`
      border-color: var(--color-selection-indicator);
      outline: 6px solid var(--color-secondary-pressed);
    `}
`;

export const BaseIconWrapper = styled.div<{ backgroundColor?: string; shape?: NodeShape }>`
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ backgroundColor }) => backgroundColor || "var(--color-background-secondary)"};
  border-radius: ${({ shape }) => {
    if (shape === "circle") return "50%";
    return "calc(0.5 * 100% / (1.75))";
  }};

  svg {
    width: 48px;
    height: 48px;
  }

  img {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }
`;

export const BaseTextContainer = styled.div<{ hasBottomHandles?: boolean; shape?: NodeShape }>`
  ${({ shape, hasBottomHandles }) =>
    shape === "rectangle"
      ? css`
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        `
      : css`
          position: absolute;
          bottom: ${hasBottomHandles ? "-40px" : "-8px"};
          width: 150%;
          transform: translateY(100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          z-index: 10;
          transition: bottom 0.2s ease-in-out;
        `}
`;

export const BaseHeader = styled.div<{ shape?: NodeShape; backgroundColor?: string }>`
  font-weight: 600;
  font-size: 13px;
  color: var(--color-foreground);
  ${({ backgroundColor }) =>
    backgroundColor &&
    css`
      background-color: ${backgroundColor};
      padding: 2px 6px;
      border-radius: 4px;
    `}
  line-height: 1.4;
  margin-bottom: 2px;
  ${({ shape }) =>
    shape === "rectangle"
      ? css`
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `
      : css`
          word-break: break-word;
        `}
`;

export const BaseSubHeader = styled.div`
  font-size: 11px;
  color: var(--color-foreground-de-emp);
  line-height: 1.3;
  word-break: break-word;
`;

export const BaseBadgeSlot = styled.div<{
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  shape?: NodeShape;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  position: absolute;
  ${({ position, shape }) => {
    const offset = shape === "circle" ? "12px" : "6px";
    switch (position) {
      case "top-left":
        return `top: ${offset}; left: ${offset};`;
      case "top-right":
        return `top: ${offset}; right: ${offset};`;
      case "bottom-left":
        return `bottom: ${offset}; left: ${offset};`;
      case "bottom-right":
        return `bottom: ${offset}; right: ${offset};`;
    }
  }}
`;
