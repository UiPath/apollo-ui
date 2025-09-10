import { Handle, Position } from "@xyflow/react";
import { motion } from "motion/react";
import styled from "@emotion/styled";
import { css } from "@emotion/react";

export const StyledAddButton = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--color-background);
  color: var(--color-foreground-emp);
  border-radius: 50%;
  border: 1px solid var(--color-border-de-emp);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    background-color: var(--color-selection-indicator);
    color: var(--color-background);
    border-color: var(--color-selection-indicator);
  }
`;

export const StyledWrapper = styled.div<{ $position: Position }>`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  ${(p) =>
    p.$position === Position.Top &&
    css`
      flex-direction: column-reverse;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
    `}
  ${(p) =>
    p.$position === Position.Bottom &&
    css`
      flex-direction: column;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
    `}
  ${(p) =>
    p.$position === Position.Left &&
    css`
      flex-direction: row-reverse;
      right: 100%;
      top: 50%;
      transform: translateY(-50%);
    `}
  ${(p) =>
    p.$position === Position.Right &&
    css`
      flex-direction: row;
      left: 100%;
      top: 50%;
      transform: translateY(-50%);
    `}
`;

export const StyledLine = styled.div<{ $isVertical: boolean; $selected: boolean }>`
  background-color: transparent;
  border-style: solid;
  border-width: 1px;
  border-color: ${(p) => (p.$selected ? "var(--color-selection-indicator)" : "var(--color-border-de-emp)")};
  height: ${(p) => (p.$isVertical ? "60px" : "1px")};
  width: ${(p) => (p.$isVertical ? "1px" : "60px")};
  transition: border-color 0.2s ease-in-out;
`;

export const StyledLabel = styled.div<{ $position: Position }>`
  position: absolute;
  background-color: var(--color-background);
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 1;
  white-space: nowrap;
  user-select: none;

  ${(p) =>
    p.$position === Position.Top &&
    css`
      bottom: calc(100% + 4px);
      left: 50%;
      transform: translateX(-50%);
    `}
  ${(p) =>
    p.$position === Position.Bottom &&
    css`
      top: calc(100% + 4px);
      left: 50%;
      transform: translateX(-50%);
    `}
  ${(p) =>
    p.$position === Position.Left &&
    css`
      right: calc(100% + 4px);
      top: 50%;
      transform: translateY(-50%);
    `}
  ${(p) =>
    p.$position === Position.Right &&
    css`
      left: calc(100% + 4px);
      top: 50%;
      transform: translateY(-50%);
    `}
`;

export const StyledNotch = styled.div<{
  $notchColor: string;
  $handleType: "artifact" | "input" | "output";
  $isVertical?: boolean;
  $visible: boolean;
  $selected: boolean;
  $hovered?: boolean;
}>`
  width: ${(p) => {
    if (p.$handleType === "input" && !p.$isVertical) return "8px";
    if (p.$handleType === "artifact") return "10px";
    return "12px";
  }};
  height: ${(p) => {
    if (p.$handleType === "input" && p.$isVertical) return "8px";
    if (p.$handleType === "artifact") return "10px";
    return "12px";
  }};
  border-width: 2px;
  border-style: solid;
  border-color: ${(p) => {
    if (p.$selected || p.$hovered) return "var(--color-primary)";
    return "var(--color-border)";
  }};
  border-radius: ${(p) => (p.$handleType === "artifact" || p.$handleType === "input" ? 0 : "50%")};
  transform: ${(p) => (p.$handleType === "artifact" ? "rotate(45deg)" : "none")};
  background-color: ${(p) => {
    if (p.$selected || p.$hovered) return "var(--color-primary)";
    return "var(--color-background, white)";
  }};
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  pointer-events: none;
  transition: all 0.2s ease-in-out;
`;

export const StyledHandle = styled(Handle)<{
  $positionPercent: number;
  $total: number;
  $visible: boolean;
}>`
  width: ${(p) => (p.position === Position.Top || p.position === Position.Bottom ? `${50 / p.$total}%` : "24px")};
  height: ${(p) => (p.position === Position.Top || p.position === Position.Bottom ? "24px" : `${50 / p.$total}%`)};
  display: flex;
  align-items: center;
  justify-content: center;
  border-width: 0;
  border-radius: 0;
  background-color: transparent;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  cursor: crosshair;

  ${(p) =>
    p.$total > 1 &&
    p.position === Position.Top &&
    css`
      top: 0;
      left: ${p.$positionPercent}%;
      transform: translate(-50%, -50%);
    `}
  ${(p) =>
    p.$total > 1 &&
    p.position === Position.Bottom &&
    css`
      bottom: 0;
      left: ${p.$positionPercent}%;
      transform: translate(-50%, 50%);
    `}
  ${(p) =>
    p.$total > 1 &&
    p.position === Position.Left &&
    css`
      left: 0;
      top: ${p.$positionPercent}%;
      transform: translate(-50%, -50%);
    `}
  ${(p) =>
    p.$total > 1 &&
    p.position === Position.Right &&
    css`
      right: 0;
      top: ${p.$positionPercent}%;
      transform: translate(50%, -50%);
    `}
`;
