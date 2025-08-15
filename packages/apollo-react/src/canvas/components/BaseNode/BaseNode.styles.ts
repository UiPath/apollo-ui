import styled from "@emotion/styled";
import { css, keyframes } from "@emotion/react";
import { NodeShape } from "./types";

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
    case "selected":
      return css`
        border-color: var(--color-selection-indicator);
        outline: 3px solid var(--color-secondary-pressed);
      `;
    case "hover":
      return css`
        outline: 3px solid var(--color-secondary-focused);
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
}>`
  position: relative;
  width: ${({ shape }) => (shape === "rectangle" ? "320px" : "100px")};
  height: 100px;
  background: ${({ backgroundColor }) => backgroundColor || "var(--color-background)"};
  border: 1.5px solid var(--color-border-de-emp);
  border-radius: ${({ shape }) => {
    if (shape === "circle") return "50%";
    return "8px";
  }};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: ${({ shape }) => (shape === "rectangle" ? "row" : "column")};
  align-items: center;
  justify-content: ${({ shape }) => (shape === "rectangle" ? "flex-start" : "center")};
  gap: ${({ shape }) => (shape === "rectangle" ? "12px" : "0")};
  padding: ${({ shape }) => (shape === "rectangle" ? "14px" : "0")};
  cursor: pointer;

  ${({ executionState }) => getExecutionStateBorder(executionState)}
  ${({ interactionState }) => getInteractionStateBorder(interactionState)}

  ${({ selected }) =>
    selected &&
    css`
      border-color: var(--color-selection-indicator);
      outline: 3px solid var(--color-secondary-pressed);
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
    return "8px";
  }};

  svg {
    width: 32px;
    height: 32px;
  }

  img {
    width: 32px;
    height: 32px;
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

export const BaseHeader = styled.div<{ shape?: NodeShape }>`
  font-weight: 600;
  font-size: 13px;
  color: var(--color-foreground);
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
