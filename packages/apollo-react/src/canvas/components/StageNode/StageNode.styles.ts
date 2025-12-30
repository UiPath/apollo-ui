import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { Colors } from '@uipath/apollo-core';
import type { StageStatus } from './StageNode.types';

export const INDENTATION_WIDTH = 30;
export const STAGE_CONTENT_PADDING_X = 16;
export const STAGE_BORDER_WIDTH = 1;
export const STAGE_CONTENT_INSET = STAGE_CONTENT_PADDING_X * 2 + STAGE_BORDER_WIDTH * 2;

export const StageContainer = styled.div<{
  selected?: boolean;
  status?: StageStatus;
  isException?: boolean;
}>`
  position: relative;
  min-width: 200px;
  min-height: 120px;
  background: var(--uix-canvas-background);
  border: 1.5px solid var(--uix-canvas-border-de-emp);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.2s ease;

  ${({ isException }) =>
    isException &&
    css`
      border: 2px dashed var(--uix-canvas-border-de-emp);
    `}

  ${({ selected }) =>
    selected &&
    css`
      border-color: var(--uix-canvas-selection-indicator);
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

  &:hover {
    outline: 4px solid ${Colors.ColorInk300};
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  }
`;

export const StageHeader = styled.div<{ isException?: boolean }>`
  position: relative;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: ${(props) =>
    props.isException
      ? '2px dashed var(--uix-canvas-border-de-emp)'
      : 'solid 1px var(--uix-canvas-border-de-emp)'};
  background: var(--uix-canvas-background);
  border-radius: 12px 12px 0 0;
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
  padding: ${(props) => (props.isStageTitleEditable ? 'none' : '4px 0px')};

  &:focus {
    outline: none;
  }

  &:hover {
    cursor: ${(props) => (props.isStageTitleEditable ? 'text' : 'pointer')};
    background: ${(props) =>
      props.isEditing || props.isStageTitleEditable
        ? 'var(--uix-canvas-background-secondary)'
        : 'transparent'};
  }
`;

export const StageContent = styled.div`
  background: var(--uix-canvas-background-secondary);
  padding: 12px ${STAGE_CONTENT_PADDING_X}px;
  border-radius: 0 0 12px 12px;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
`;

export const StageTaskList = styled.div`
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const StageTaskGroup = styled.div<{ isParallel?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: ${({ isParallel }) => (isParallel ? `${INDENTATION_WIDTH}px` : '0')};
`;

export const StageParallelLabel = styled.div`
  position: absolute;
  left: -40px;
  top: 50%;
  transform: translateY(-50%) rotate(-90deg);
  font-size: 11px;
  font-weight: 500;
  color: var(--uix-canvas-foreground-de-emp);
  text-transform: capitalize;
  letter-spacing: 0.3px;
  white-space: nowrap;
`;

export const StageParallelBracket = styled.div`
  position: absolute;
  left: -12px;
  top: 0;
  bottom: 0;
  width: 8px;
  border-left: 1.5px solid var(--uix-canvas-border-de-emp);
  border-top: 1.5px solid var(--uix-canvas-border-de-emp);
  border-bottom: 1.5px solid var(--uix-canvas-border-de-emp);
  border-radius: 3px 0 0 3px;
`;

export const StageTaskWrapper = styled.div<{ isParallel?: boolean }>`
  width: ${({ isParallel }) =>
    isParallel ? 'var(--stage-task-width-parallel, 216px)' : 'var(--stage-task-width, 246px)'};
  height: 40px;
`;

export const StageTask = styled.div<{
  status?: StageStatus;
  selected?: boolean;
  isParallel?: boolean;
  isDragEnabled?: boolean;
}>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--uix-canvas-background);
  border: 1px solid var(--uix-canvas-border-de-emp);
  border-radius: 6px;
  font-size: 13px;
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

  .task-remove-button {
    display: none;
  }

  &:hover .task-remove-button {
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
    selected &&
    css`
      outline: 2px solid var(--uix-canvas-selection-indicator);
    `}
`;

export const StageTaskIcon = styled.div`
  width: 20px;
  height: 20px;
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

export const StageTaskRemoveButton = styled.div`
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: transparent;
  color: var(--uix-canvas-foreground-de-emp);
  transition: color 0.2s ease;
  flex-shrink: 0;

  &:hover {
    color: var(--uix-canvas-foreground);
  }
`;

export const StageTaskDragPlaceholderWrapper = styled.div`
  width: var(--stage-task-width, 246px);
  height: 40px;
`;

export const StageTaskDragPlaceholder = styled.div<{ isTargetParallel?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: 2px dashed var(--uix-canvas-selection-indicator);
  border-radius: 6px;

  height: 100%;
  width: ${({ isTargetParallel }) =>
    isTargetParallel
      ? 'var(--stage-task-width-parallel, 216px)'
      : 'var(--stage-task-width, 246px)'};
`;
