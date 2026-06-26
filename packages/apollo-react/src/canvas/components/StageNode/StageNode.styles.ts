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
  background: var(--canvas-background);
  border: ${STAGE_BORDER_WIDTH}px solid var(--canvas-border-de-emp);
  border-radius: ${Spacing.SpacingBase};
  display: flex;
  flex-direction: column;
  cursor: pointer;

  ${({ selected }) =>
    selected
      ? css`
          border-color: var(--canvas-primary);
          outline: 4px solid var(--canvas-secondary-pressed);
        `
      : css`
          &:hover {
            outline: 4px solid var(--canvas-secondary-pressed);
          }
        `}

  ${({ status }) =>
    status === 'Completed' &&
    css`
      border-color: var(--canvas-success-icon);
    `}

  ${({ status }) =>
    status === 'InProgress' &&
    css`
      border-color: var(--canvas-info-icon);
    `}

  ${({ status }) =>
    status === 'Paused' &&
    css`
      border-color: var(--canvas-warning-icon);
    `}

  ${({ status }) =>
    status === 'Failed' &&
    css`
      border-color: var(--canvas-error-icon);
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
  flex-direction: column;
  padding: ${Spacing.SpacingS} ${Spacing.SpacingBase};
  border-bottom: solid 1px var(--canvas-border-de-emp);
  background: ${(props) => (props.isException ? 'var(--color-background-secondary)' : 'var(--canvas-background)')};
  border-radius: ${Spacing.SpacingBase} ${Spacing.SpacingBase} 0 0;
  overflow: hidden;
`;

export const StageContent = styled.div`
  padding: 15px ${STAGE_CONTENT_PADDING_X}px ${Spacing.SpacingS} ${STAGE_CONTENT_PADDING_X}px;
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

export const StageTaskGroupContainer = styled.div<{ isParallel?: boolean }>`
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
  background: var(--canvas-background);
  transform: translateY(-50%) rotate(-90deg);
  color: var(--canvas-foreground-de-emp);
  text-transform: capitalize;
  letter-spacing: 0.3px;
  white-space: nowrap;
`;

export const StageParallelBracket = styled.div`
  margin-left: ${Padding.PadM};
  width: ${Spacing.SpacingXs};
  flex: 1;
  border: 1.5px solid var(--canvas-border-de-emp);
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
  isPlaceholder?: boolean;
}>`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${Spacing.SpacingXs};
  padding: ${Padding.PadS} ${Padding.PadM};
  background: var(--canvas-background);
  border: 1px ${({ isPlaceholder }) => (isPlaceholder ? 'dashed' : 'solid')}
    var(--canvas-border-de-emp);
  border-radius: ${Spacing.SpacingXs};
  color: var(--canvas-foreground);
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
    display: flex;
  }

  ${({ status }) =>
    status === 'InProgress' &&
    css`
      border-color: var(--canvas-info-icon);
    `}

  ${({ status }) =>
    status === 'Completed' &&
    css`
      border-color: var(--canvas-success-icon);
    `}

  ${({ status }) =>
    status === 'Paused' &&
    css`
      border-color: var(--canvas-warning-icon);
    `}

  ${({ status }) =>
    status === 'Failed' &&
    css`
      border-color: var(--canvas-error-icon);
    `}

  ${({ selected }) =>
    selected
      ? css`
          border-color: var(--canvas-primary);
          outline: 4px solid var(--canvas-secondary-pressed);
        `
      : css`
          &:hover {
            border-color: var(--canvas-primary);
            outline: 4px solid var(--canvas-secondary-pressed);
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

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const StageTaskRetryDuration = styled.div<{ status?: 'warning' | 'info' | 'error' }>`
  display: flex;
  align-items: center;
  ${({ status }) =>
    status === 'info' &&
    css`
      color: var(--canvas-info-text);
    `}

  ${({ status }) =>
    status === 'warning' &&
    css`
      color: var(--canvas-warning-text);
    `}

  ${({ status }) =>
    status === 'error' &&
    css`
      color: var(--canvas-error-text);
    `}
`;

export const StageTaskDragPlaceholderWrapper = styled.div`
  width: var(--stage-task-width, 246px);
  height: 36px;
`;

export const StageHeaderChipsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${Padding.PadS};
  margin-top: ${Spacing.SpacingXs};
`;

export const StageChip = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${Padding.PadS};
  box-sizing: border-box;
  height: ${Spacing.SpacingL};
  padding: 0 ${Spacing.SpacingXs};
  border-radius: 10px;
  border: 1px solid var(--canvas-border-de-emp);
  background: transparent;
  color: var(--canvas-foreground);
  cursor: pointer;

  &:hover {
    background: var(--color-background-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--canvas-primary);
    outline-offset: 2px;
  }
`;

export const StageAdditionalTasksSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${Spacing.SpacingS};
`;

export const StageAdditionalTasksHeaderSection = styled.div`
  height: 36px;
  display: flex;
  align-items: center;
`;

export const StageTaskDragPlaceholder = styled.div<{ isTargetParallel?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${Spacing.SpacingXs};
  padding: ${Padding.PadL} ${Padding.PadXxl};
  background: transparent;
  border: 2px dashed var(--canvas-selection-indicator);
  border-radius: 6px;

  height: 100%;
  width: ${({ isTargetParallel }) => (isTargetParallel ? 'var(--stage-task-width-parallel, 216px)' : 'var(--stage-task-width, 246px)')};
`;
