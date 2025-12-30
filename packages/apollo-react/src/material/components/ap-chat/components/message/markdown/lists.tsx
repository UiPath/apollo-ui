import React from 'react';

import { Box } from '@mui/material';
import token from '@uipath/apollo-core';

import { useChatState } from '../../../providers/chat-state-provider';
import { Text } from './text';

export const Ul = React.memo(({ children }: { children?: React.ReactNode }) => {
  return (
    <Box
      component="ul"
      sx={{
        listStyleType: 'disc',
        marginBlock: 'unset',
        marginInline: 'unset',
        paddingInlineStart: token.Spacing.SpacingM,
        display: 'block',
        lineHeight: token.FontFamily.FontMicroLineHeight,
      }}
    >
      {children}
    </Box>
  );
});

export const Ol = React.memo(
  ({ children, start }: { children?: React.ReactNode; start?: number }) => {
    return (
      <Box
        component="ol"
        start={start}
        sx={{
          marginBlock: 'unset',
          marginInline: 'unset',
          paddingInlineStart: token.Spacing.SpacingBase,
          lineHeight: token.FontFamily.FontMicroLineHeight,
        }}
      >
        {children}
      </Box>
    );
  }
);

export const Li = React.memo(({ children }: { children?: React.ReactNode }) => {
  const { spacing } = useChatState();

  return (
    <Box
      component="li"
      sx={{
        '&::marker': {
          color: 'var(--color-foreground)',
          fontSize: token.FontFamily.FontMSize,
        },
      }}
    >
      {/* Only return ap-typography on strings that are not just empty spaces */}
      {React.Children.map(children, (child) => {
        if (typeof child === 'string') {
          const hasVisibleContent = child.trim().length > 0;

          if (!hasVisibleContent) {
            return null;
          }

          return Text({
            children: child,
            customStyle: { display: 'inline' },
            variant: spacing.markdownTokens.li,
          });
        }

        return child;
      })}
    </Box>
  );
});
