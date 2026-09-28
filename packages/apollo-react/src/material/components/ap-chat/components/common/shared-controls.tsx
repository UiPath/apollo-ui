import { styled } from '@mui/material';
import type React from 'react';

export const VisuallyHidden: React.ComponentType<React.HTMLAttributes<HTMLSpanElement>> = styled(
  'span'
)({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
});
