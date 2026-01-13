import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Padding, Spacing } from '@uipath/apollo-core';
import type { StageStatus } from './StageNode.types';

export const INDENTATION_WIDTH = 26;
export const STAGE_CONTENT_PADDING_X = 14;
export const STAGE_BORDER_WIDTH = 2;
export const STAGE_CONTENT_INSET = STAGE_CONTENT_PADDING_X * 2 + STAGE_BORDER_WIDTH * 2;

export const StageContainer = styled.div<{
  selected?: boolean;
  status?: StageStatus;
  width?: number;
}>`
  position: relative;
  min-width: 288px;
  width: ${({ width }) => (width ? `${width}px` : 'auto')};
  background: var(--uix-canvas-background);
  border: ${STAGE_BORDER_WIDTH}px solid var(--uix-canvas-border-de-emp);
  border-radius: ${Spacing.SpacingBase};
  display: flex;
  flex-direction: column;
  cursor: pointer;

  ${({ selected }) =>
    selected
      ? css`
          border-color: var(--uix-canvas-primary);
          outline: 4px solid var(--uix-canvas-secondary-pressed);
        `
      : css`
          &:hover {
            outline: 4px solid var(--uix-canvas-secondary-pressed);
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

export const StageHeader = styled.div<{ isException?: boolean }>`
  position: relative;
  display: flex;
  justify-content: space-between;
  padding: ${Spacing.SpacingS} ${Spacing.SpacingBase};
  border-bottom: solid 1px var(--uix-canvas-border-de-emp);
  background: ${(props) => (props.isException ? 'var(--color-background-secondary)' : 'var(--uix-canvas-background)')};
  border-radius: ${Spacing.SpacingBase} ${Spacing.SpacingBase} 0 0;
  overflow: hidden;
`;

export const StageTitleContainer = styled.div<{ isEditing?: boolean }>`
  display: inline-block;
  border-radius: 4px;
  height: 100%;
  border: ${(props) => (props.isEditing ? '1px solid var(--uix-canvas-border-de-emp)' : 'none')};
`;

export const StageTitleInput = styled.input<{
  isEditing?: boolean;
  isStageTitleEditable?: boolean;
  value?: string;
}>`
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  cursor: text;
  border: none;
  background: transparent;
  text-overflow: ellipsis;
  border-radius: 2px;
  min-width: 100px;
  width: max-content;
  max-width: 180px;
  padding: ${(props) => (props.isStageTitleEditable ? 'none' : `${Padding.PadS} 0px`)};

  &:focus {
    outline: none;
  }

  &:hover {
    cursor: ${(props) => (props.isStageTitleEditable ? 'text' : 'pointer')};
    background: ${(props) => (props.isEditing || props.isStageTitleEditable ? 'var(--uix-canvas-background-secondary)' : 'transparent')};
  }
`;

export const StageContent = styled.div`
  padding: 15px ${STAGE_CONTENT_PADDING_X}px ${Spacing.SpacingBase} ${STAGE_CONTENT_PADDING_X}px;
  border-radius: 0 0 ${Spacing.SpacingBase} ${Spacing.SpacingBase};
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export const StageTaskList = styled.div`
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${Spacing.SpacingS};
`;

export const StageTaskGroup = styled.div<{ isParallel?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${Spacing.SpacingS};
  width: ${({ isParallel }) => (isParallel ? 'var(--stage-task-width-parallel, 216px)' : 'var(--stage-task-width, 246px)')};
`;

export const StageParallelLabel = styled.div`
  position: absolute;
  left: -52px;
  top: 50%;
  padding: 0px ${Padding.PadM};
  display: flex;
  justify-content: center;
  background: var(--uix-canvas-background);
  transform: translateY(-50%) rotate(-90deg);
  color: var(--uix-canvas-foreground-de-emp);
  text-transform: capitalize;
  letter-spacing: 0.3px;
  white-space: nowrap;
`;

export const StageParallelBracket = styled.div`
  margin-left: ${Padding.PadM};
  width: ${Spacing.SpacingXs};
  flex: 1;
  border: 1.5px solid var(--uix-canvas-border-de-emp);
  border-right: none;
`;

export const StageTaskWrapper = styled.div<{ isParallel?: boolean }>`
  width: ${({ isParallel }) =>
    isParallel ? 'var(--stage-task-width-parallel, 216px)' : 'var(--stage-task-width, 246px)'};
  border-radius: ${Spacing.SpacingXs};
  height: 36px;
`;

export const StageTask = styled.div<{
  status?: StageStatus;
  selected?: boolean;
  isParallel?: boolean;
  isDragEnabled?: boolean;
  isMenuOpen?: boolean;
}>`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${Spacing.SpacingXs};
  padding: ${Padding.PadS} ${Padding.PadM};
  background: var(--uix-canvas-background);
  border: 1px solid var(--uix-canvas-border-de-emp);
  border-radius: ${Spacing.SpacingXs};
  color: var(--uix-canvas-foreground);
  transition: all 0.2s ease;
  min-height: 36px;
  width: ${({ isParallel, isDragEnabled }) =>
    isDragEnabled
      ? '100%'
      : isParallel
        ? 'var(--stage-task-width-parallel, 216px)'
        : 'var(--stage-task-width, 246px)'};
  height: ${({ isDragEnabled }) => (isDragEnabled ? '100%' : 'auto')};

  .task-menu-icon-button {
    display: ${({ isMenuOpen }) => (isMenuOpen ? 'flex' : 'none')};
  }

  &:hover .task-menu-icon-button {
    display: flex;
  }

  ${({ status }) =>
    status === 'InProgress' &&
    css`
      border-color: var(--uix-canvas-info-icon);
    `}

  ${({ status }) =>
    status === 'Completed' &&
    css`
      border-color: var(--uix-canvas-success-icon);
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

  ${({ selected }) =>
    selected
      ? css`
          border-color: var(--uix-canvas-primary);
          outline: 4px solid var(--uix-canvas-secondary-pressed);
        `
      : css`
          &:hover {
            border-color: var(--uix-canvas-primary);
            outline: 4px solid var(--uix-canvas-secondary-pressed);
          }
        `}
`;

export const StageTaskIcon = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const StageTaskRetryDuration = styled.div<{ status?: 'warning' | 'info' | 'error' }>`
  ${({ status }) =>
    status === 'info' &&
    css`
      color: var(--uix-canvas-info-text);
    `}

  ${({ status }) =>
    status === 'warning' &&
    css`
      color: var(--uix-canvas-warning-text);
    `}

  ${({ status }) =>
    status === 'error' &&
    css`
      color: var(--uix-canvas-error-text);
    `}
`;

export const StageTaskDragPlaceholderWrapper = styled.div`
  width: var(--stage-task-width, 246px);
  height: 36px;
`;

export const StageTaskDragPlaceholder = styled.div<{ isTargetParallel?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${Spacing.SpacingXs};
  padding: ${Padding.PadL} ${Padding.PadXxl};
  background: transparent;
  border: 2px dashed var(--uix-canvas-selection-indicator);
  border-radius: 6px;

  height: 100%;
  width: ${({ isTargetParallel }) => (isTargetParallel ? 'var(--stage-task-width-parallel, 216px)' : 'var(--stage-task-width, 246px)')};
`;
