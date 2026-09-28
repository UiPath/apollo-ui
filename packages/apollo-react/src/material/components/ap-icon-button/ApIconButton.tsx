import { IconButton } from '@mui/material';
import React from 'react';

import type { ApIconButtonProps } from './ApIconButton.types';

export const ApIconButton = React.forwardRef<HTMLButtonElement, ApIconButtonProps>((props, ref) => {
  const { color = 'primary', size = 'medium', disabled, label, expanded, ...rest } = props;

  return (
    <IconButton
      ref={ref}
      color={color}
      size={size}
      disabled={disabled}
      aria-expanded={expanded}
      aria-label={label ?? 'Icon button'}
      {...rest}
    >
      {props.children}
    </IconButton>
  );
});

ApIconButton.displayName = 'ApIconButton';
