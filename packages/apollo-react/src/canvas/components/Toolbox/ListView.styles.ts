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
  transition: all 0.15s ease;

  &:hover,
  &.active {
    background: var(--canvas-background-hover);
  }

  &.active {
    outline: 1px solid var(--canvas-primary);
    outline-offset: -1px;
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

/**
 * Fallback badge rendered inside {@link IconContainer} when a {@link ListItem}
 * has no icon source (no `url`, `name`, or `Component`). Displays a single
 * uppercase character — typically the first letter of the item's name — on a
 * solid brand circle. Mirrors UiPath StudioWeb's `<ui-package-icon>` fallback.
 */
export const InitialsBadge = styled.span`
  display: flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--canvas-primary);
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
  user-select: none;
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
