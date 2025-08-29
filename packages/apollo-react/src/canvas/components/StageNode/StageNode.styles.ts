import styled from "@emotion/styled";
import { css } from "@emotion/react";
import type { StageStatus } from "./StageNode.types";

export const StageContainer = styled.div<{ selected?: boolean; status?: StageStatus }>`
  position: relative;
  width: 270px;
  min-height: auto;
  background: var(--color-background);
  border: 1.5px solid var(--color-border-de-emp);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.2s ease;

  ${({ selected }) =>
    selected &&
    css`
      outline: 6px solid var(--color-secondary-pressed);
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

export const StageHeader = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-de-emp);
  background: var(--color-background);
  border-radius: 12px 12px 0 0;
  overflow: hidden;
`;

export const StageHeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const StageHeaderIcon = styled.div`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-foreground-de-emp);

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const StageTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-foreground);
`;

export const StageContent = styled.div`
  background: var(--color-background-secondary);
  padding: 12px 16px;
  border-radius: 0 0 12px 12px;
  overflow: hidden;
`;

export const StageProcessList = styled.div`
  margin: 12px 0 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const StageProcessGroup = styled.div<{ isParallel?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: ${({ isParallel }) => (isParallel ? "30px" : "0")};
`;

export const StageParallelLabel = styled.div`
  position: absolute;
  left: -40px;
  top: 50%;
  transform: translateY(-50%) rotate(-90deg);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-foreground-de-emp);
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
  border-left: 1.5px solid var(--color-border-de-emp);
  border-top: 1.5px solid var(--color-border-de-emp);
  border-bottom: 1.5px solid var(--color-border-de-emp);
  border-radius: 3px 0 0 3px;
`;

export const StageProcessItem = styled.div<{ status?: StageStatus }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border-de-emp);
  border-radius: 6px;
  font-size: 13px;
  color: var(--color-foreground);
  transition: all 0.2s ease;
  min-height: 36px;

  ${({ status }) =>
    status === "InProgress" &&
    css`
      border-color: var(--color-info-icon);
    `}

  ${({ status }) =>
    status === "Completed" &&
    css`
      border-color: var(--color-success-icon);
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
`;

export const StageProcessIcon = styled.div`
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

export const StageProcessLabel = styled.span`
  overflow: hidden;
  white-space: no-wrap;
  text-overflow: ellipsis;
`;
