import styled from '@emotion/styled';
import { motion } from 'motion/react';
import { List } from 'react-window';

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  border-top: 1px solid var(--canvas-border-de-emp);

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
  // Reserve the focus ring geometry in the resting state (invisible via a
  // transparent color) so activating a row only flips outline-color. Without
  // this the outline falls back to UA defaults (3px / currentColor) and every
  // sub-property jumps at once, flashing a thick dark border under transition.
  outline: 1px solid transparent;
  outline-offset: -1px;
  transition: background-color 0.15s ease, opacity 0.15s ease, outline-color 0.15s ease;

  &:hover,
  &.active {
    background: var(--canvas-background-hover);
  }

  &.active {
    outline-color: var(--canvas-primary);
  }
`;

export const IconContainer = styled.div<{ bgColor?: string }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.bgColor || 'var(--canvas-background)'};
  border-radius: 8px;
  color: var(--canvas-foreground-emp);
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
    background: var(--canvas-border-de-emp);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--canvas-border);
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
