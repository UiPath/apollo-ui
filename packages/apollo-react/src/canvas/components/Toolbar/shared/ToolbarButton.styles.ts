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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: ${({ $isToggled, $hoverColor }) =>
    ($isToggled && ($hoverColor || 'var(--uix-canvas-background-secondary)')) || 'transparent'};
  border: none;
  border-radius: 8px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
  transition:
    background 0.15s ease,
    opacity 0.15s ease;
  pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};

  &:hover:not(:disabled) {
    background: ${({ $hoverColor }) => $hoverColor || 'var(--uix-canvas-background-secondary)'};
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  svg {
    color: ${({ $color }) => $color || 'var(--uix-canvas-foreground)'};
  }
`;
