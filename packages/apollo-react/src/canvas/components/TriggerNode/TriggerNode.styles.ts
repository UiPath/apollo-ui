import { css } from '@emotion/react';
import styled from '@emotion/styled';
import type { TriggerStatus } from './TriggerNode.types';

export const TriggerContainer = styled.div<{ selected?: boolean; status?: TriggerStatus }>`
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--uix-canvas-background);
  border: 1.5px solid var(--uix-canvas-border-de-emp);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  ${({ selected }) =>
    selected 
      ? css`
          border-color: var(--uix-canvas-primary);
          outline: 4px solid var(--uix-canvas-secondary-pressed);
        `
      : css`
          &:hover {
            outline: 4px solid var(--uix-canvas-secondary-focused);
          }
        `}

  ${({ status }) =>
    status === 'Completed' &&
    css`
      border-color: var(--uix-canvas-success-icon);
    `}

  ${({ status }) =>
    status === 'InProgress' &&
    css`
      border-color: var(--uix-canvas-info-icon);
    `}

  ${({ status }) =>
    status === 'Paused' &&
    css`
      border-color: var(--uix-canvas-warning-icon);
    `}

  ${({ status }) =>
    status === 'Failed' &&
    css`
      border-color: var(--uix-canvas-error-icon);
    `}

  ${({ status }) =>
    status === 'NotExecuted' &&
    css`
      opacity: 0.8;
    `}
`;

export const TriggerIconWrapper = styled.div<{ status?: TriggerStatus, nodeHeight?: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--uix-canvas-foreground);
  background: var(--uix-canvas-background-secondary);
  border-radius: 50%;

  width: ${({ nodeHeight }) => {
    const scaleFactor = nodeHeight ? nodeHeight / 96 : 1;
    return `${72 * scaleFactor}px`;
  }};
  height: ${({ nodeHeight }) => {
    const scaleFactor = nodeHeight ? nodeHeight / 96 : 1;
    return `${72 * scaleFactor}px`;
  }};

  ${({ status }) =>
    status === 'Completed' &&
    css`
      color: var(--uix-canvas-success-icon);
    `}

  ${({ status }) =>
    status === 'InProgress' &&
    css`
      color: var(--uix-canvas-info-icon);
    `}

  ${({ status }) =>
    status === 'Paused' &&
    css`
      color: var(--uix-canvas-warning-icon);
    `}

  ${({ status }) =>
    status === 'Failed' &&
    css`
      color: var(--uix-canvas-error-icon);
    `}

  svg {
    width: ${({ nodeHeight }) => {
      const scaleFactor = nodeHeight ? nodeHeight / 96 : 1;
      return `${40 * scaleFactor}px`;
    }};
    height: ${({ nodeHeight }) => {
      const scaleFactor = nodeHeight ? nodeHeight / 96 : 1;
      return `${40 * scaleFactor}px`;
    }};
  }
`;
