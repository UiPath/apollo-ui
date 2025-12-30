import React from 'react';

import { IconButton, IconButtonProps, styled } from '@mui/material';
import token from '@uipath/apollo-core';

const StyledIconButton = styled(IconButton)(() => ({
  '&.MuiIconButton-root': {
    borderRadius: token.Border.BorderRadiusM,

    '&:hover, &:focus': {
      color: 'var(--color-foreground-emp)',
      backgroundColor: 'var(--color-icon-button-hover) !important',
    },
  },
}));

export interface AutopilotChatIconButtonProps extends IconButtonProps {}

export const AutopilotChatIconButton = React.forwardRef<
  HTMLButtonElement,
  AutopilotChatIconButtonProps
>((props, ref) => <StyledIconButton ref={ref} {...props} />);

AutopilotChatIconButton.displayName = 'AutopilotChatIconButton';
