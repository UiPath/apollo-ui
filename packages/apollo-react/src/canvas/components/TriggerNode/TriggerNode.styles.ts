import styled from "@emotion/styled";
import { css } from "@emotion/react";
import type { TriggerStatus } from "./TriggerNode.types";

export const TriggerContainer = styled.div<{ selected?: boolean; status?: TriggerStatus }>`
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--color-background);
  border: 2px solid var(--color-border-de-emp);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);

  ${({ selected }) =>
    selected &&
    css`
      outline: 4px solid var(--color-secondary-pressed);
      border-color: var(--color-selection-indicator);
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
    `}

  ${({ status }) =>
    status === "Completed" &&
    css`
      border-color: var(--color-success-icon);
    `}

  ${({ status }) =>
    status === "InProgress" &&
    css`
      border-color: var(--color-info-icon);
    `}

  ${({ status }) =>
    status === "Paused" &&
    css`
      border-color: var(--color-warning-icon);
    `}

  ${({ status }) =>
    status === "Failed" &&
    css`
      border-color: var(--color-error-icon);
    `}

  ${({ status }) =>
    status === "NotExecuted" &&
    css`
      opacity: 0.8;
    `}

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  }
`;

export const TriggerIconWrapper = styled.div<{ status?: TriggerStatus }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-foreground-emp);

  ${({ status }) =>
    status === "Completed" &&
    css`
      color: var(--color-success-icon);
    `}

  ${({ status }) =>
    status === "InProgress" &&
    css`
      color: var(--color-info-icon);
    `}

  ${({ status }) =>
    status === "Paused" &&
    css`
      color: var(--color-warning-icon);
    `}

  ${({ status }) =>
    status === "Failed" &&
    css`
      color: var(--color-error-icon);
    `}

  svg {
    width: 24px;
    height: 24px;
  }
`;
