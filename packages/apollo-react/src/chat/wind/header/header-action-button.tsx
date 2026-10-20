import {
  Button,
  type ButtonProps,
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import React from 'react';

import { useChatState } from '../../headless/providers/chat-state-provider';

export interface HeaderActionButtonProps extends Omit<ButtonProps, 'size' | 'icon' | 'variant'> {
  label: string;
}

/**
 * Icon-only header button with its label as tooltip and accessible name.
 */
export const HeaderActionButton = React.forwardRef<HTMLButtonElement, HeaderActionButtonProps>(
  ({ label, children, ...props }, ref) => {
    const { spacing } = useChatState();

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            variant="ghost"
            icon
            size={spacing.compactMode ? '3xs' : '2xs'}
            aria-label={label}
            {...props}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>{label}</TooltipContent>
        </TooltipPortal>
      </Tooltip>
    );
  }
);
HeaderActionButton.displayName = 'HeaderActionButton';
