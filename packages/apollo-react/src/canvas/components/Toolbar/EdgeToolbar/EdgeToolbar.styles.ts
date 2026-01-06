import styled from '@emotion/styled';
import { motion } from 'motion/react';

export const StyledEdgeToolbarContainer = styled(motion.div)`
  position: absolute;
  pointer-events: auto;
  z-index: 1000;
  top: 0;
  left: 0;
`;

export const StyledEdgeToolbarContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 2px;
  background: var(--uix-canvas-background);
  border: 1px solid var(--uix-canvas-border-grid);
  border-radius: 8px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.04);
`;
