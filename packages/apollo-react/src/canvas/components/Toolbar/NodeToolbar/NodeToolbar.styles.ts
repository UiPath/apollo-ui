import styled from '@emotion/styled';
import { motion } from 'motion/react';

/**
 * Absolutely-positioned flex track that spans the full width (or height)
 * of the node along one axis, and lets its child (the visual toolbar)
 * center / start / end itself via `justify-content`. This keeps the toolbar
 * centered even when it is wider than the node (where `margin: auto` would
 * degrade to 0 because the element is over-constrained).
 */
export const StyledToolbarPositioner = styled.div<{
  $position: 'top' | 'bottom' | 'left' | 'right';
  $align?: 'start' | 'center' | 'end';
}>`
  position: absolute;
  display: flex;
  pointer-events: none;
  z-index: 10;

  ${({ $position, $align = 'center' }) => {
    const justifyContent =
      $align === 'start' ? 'flex-start' : $align === 'end' ? 'flex-end' : 'center';

    switch ($position) {
      case 'top':
        return `
          top: -46px;
          left: 0;
          right: 0;
          flex-direction: row;
          justify-content: ${justifyContent};
        `;
      case 'bottom':
        return `
          bottom: -46px;
          left: 0;
          right: 0;
          flex-direction: row;
          justify-content: ${justifyContent};
        `;
      case 'left':
        return `
          left: -46px;
          top: 0;
          bottom: 0;
          flex-direction: column;
          justify-content: ${justifyContent};
        `;
      case 'right':
        return `
          right: -46px;
          top: 0;
          bottom: 0;
          flex-direction: column;
          justify-content: ${justifyContent};
        `;
    }
  }}
`;

export const StyledToolbarContainer = styled(motion.div, {
  shouldForwardProp: (prop: string) => !prop.startsWith('$'),
})<{
  $position: 'top' | 'bottom' | 'left' | 'right';
}>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--canvas-background-raised);
  border: 1px solid var(--canvas-background-overlay);
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  pointer-events: auto;
  flex-direction: ${({ $position }) =>
    $position === 'left' || $position === 'right' ? 'column' : 'row'};
`;

export const StyledToolbarSeparator = styled.div<{ $orientation: 'horizontal' | 'vertical' }>`
  flex: 0 0 auto;
  width: ${({ $orientation }) => ($orientation === 'horizontal' ? '100%' : '1px')};
  height: ${({ $orientation }) => ($orientation === 'horizontal' ? '1px' : '20px')};
  background: var(--canvas-background-overlay);
  align-self: center;
`;

export const StyledDropdownMenu = styled(motion.div)`
  position: absolute;
  top: -2px;
  left: calc(100% + 4px);
  min-width: 180px;
  background: var(--canvas-background);
  border: 1px solid var(--canvas-border-subtle);
  border-radius: 6px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.04);
  padding: 4px;
  z-index: 1000;
  pointer-events: auto;
`;

export const StyledDropdownItem = styled.button<{
  $disabled?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
  transition: background 0.15s ease;
  font-size: 14px;
  color: var(--canvas-foreground);
  text-align: left;
  pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};

  &:hover:not(:disabled) {
    background: var(--canvas-background-secondary);
  }

  svg {
    flex-shrink: 0;
    color: var(--canvas-foreground);
  }

  span {
    flex: 1;
    color: var(--canvas-foreground);
  }
`;

export const StyledOverflowContainer = styled.div`
  position: relative;
`;
