import styled from '@emotion/styled';
import { motion } from 'motion/react';

export const StyledToolbarButton = styled(motion.button, {
  shouldForwardProp: (prop: string) => !prop.startsWith('$'),
})<{
  $disabled?: boolean;
  $isToggled?: boolean;
  $color?: string;
  $hoverColor?: string;
}>`
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: ${({ $isToggled, $hoverColor }) =>
    ($isToggled && ($hoverColor || 'var(--canvas-background-hover)')) || 'transparent'};
  border: none;
  border-radius: 4px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
  color: ${({ $color, $isToggled }) =>
    $color || ($isToggled ? 'var(--canvas-foreground)' : 'var(--canvas-foreground-de-emp)')};
  transition:
    background-color 140ms ease,
    color 140ms ease,
    opacity 140ms ease;
  pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};

  svg {
    width: 16px;
    height: 16px;
    color: inherit;
    transition:
      width 140ms ease,
      height 140ms ease;
  }

  &:hover:not(:disabled) {
    background: ${({ $hoverColor }) => $hoverColor || 'var(--canvas-background-hover)'};
    color: var(--canvas-foreground);
  }

  &:hover:not(:disabled) svg {
    width: 18px;
    height: 18px;
  }
`;
