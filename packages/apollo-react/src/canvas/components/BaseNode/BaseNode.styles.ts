import styled from "@emotion/styled";
import { css } from "@emotion/react";
import { NodeShape } from "./BaseNode.types";

export const BaseContainer = styled.div<{ selected?: boolean; shape?: NodeShape }>`
  position: relative;
  width: ${({ shape }) => (shape === "rectangle" ? "320px" : "100px")};
  height: 100px;
  background: var(--color-background);
  border: 1.5px solid var(--color-border-de-emp);
  border-radius: ${({ shape }) => {
    if (shape === "circular") return "50%";
    return "8px";
  }};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: ${({ shape }) => (shape === "rectangle" ? "row" : "column")};
  align-items: center;
  justify-content: ${({ shape }) => (shape === "rectangle" ? "flex-start" : "center")};
  gap: ${({ shape }) => (shape === "rectangle" ? "12px" : "0")};
  padding: ${({ shape }) => (shape === "rectangle" ? "16px" : "0")};
  cursor: pointer;
  transition: all 0.2s ease;

  ${({ selected }) =>
    selected &&
    css`
      border-color: var(--color-selection-indicator);
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
    `}

  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
`;

export const BaseIconWrapper = styled.div<{ shape?: NodeShape }>`
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-secondary);
  border-radius: ${({ shape }) => {
    if (shape === "circular") return "50%";
    return "8px";
  }};

  svg {
    width: 24px;
    height: 24px;
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
    const offset = shape === "circular" ? "12px" : "6px";
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
