import styled from '@emotion/styled';
import { motion } from 'motion/react';
import { List } from 'react-window';

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  border-top: 1px solid var(--uix-canvas-border-de-emp);

  &:first-of-type {
    border-top: none;
  }

  &.loading {
    opacity: 0.5;
    pointer-events: none;
  }
`;

export const ListItemButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all 0.15s ease;

  &:hover {
    background: var(--uix-canvas-background-hover);
  }
`;

export const IconContainer = styled.div<{ bgColor?: string }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.bgColor || 'var(--uix-canvas-background)'};
  border-radius: 8px;
  color: var(--uix-canvas-foreground-emp);
  opacity: 0.9;
  flex-shrink: 0;
  // Icons should show below the inset outline
  z-index: -1;
`;

export const StyledList = styled(List)`
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--uix-canvas-border-de-emp);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--uix-canvas-border);
  }

  .list-view-item-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .loading {
    opacity: 0.5;
    pointer-events: none;
    cursor: not-allowed;

    // Ensure all child elements are also greyed out
    * {
      opacity: 0.7;
    }
  }
` as typeof List;
