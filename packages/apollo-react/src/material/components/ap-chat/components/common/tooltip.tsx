import { type TooltipProps as MuiTooltipProps, Tooltip } from '@mui/material';
import token from '@uipath/apollo-core';
import React from 'react';

import { useChatScroll } from '../../providers/chat-scroll-provider';
import { useChatState } from '../../providers/chat-state-provider';

export interface AutopilotChatTooltipProps {
  title: React.ReactNode;
  disableInteractive?: boolean;
  children: React.ReactElement;
  placement?: MuiTooltipProps['placement'];
  /** Controlled open state */
  open?: boolean;
  /** Callback when tooltip requests to open */
  onOpen?: () => void;
  /** Callback when tooltip requests to close */
  onClose?: () => void;
  /** Custom slot props (merged with defaults) */
  slotProps?: MuiTooltipProps['slotProps'];
  /** Delay in ms before showing tooltip on hover */
  enterDelay?: number;
  /** Delay in ms before showing tooltip when moving to another element */
  enterNextDelay?: number;
}

export const AutopilotChatTooltip: React.FC<AutopilotChatTooltipProps> = React.memo(
  ({
    title,
    disableInteractive = false,
    placement = 'bottom',
    children,
    open: controlledOpen,
    onOpen: controlledOnOpen,
    onClose: controlledOnClose,
    slotProps: customSlotProps,
    enterDelay,
    enterNextDelay,
  }) => {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const { overflowContainer } = useChatScroll();
    const { portalContainer } = useChatState();
    const tooltipRef = React.useRef<HTMLDivElement>(null);

    // Use controlled state if provided, otherwise use internal state
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    // Close the tooltip immediately at the first sign of scrolling
    React.useEffect(() => {
      if (!overflowContainer || !open) {
        return undefined;
      }

      const handleScroll = () => {
        if (isControlled) {
          controlledOnClose?.();
        } else {
          setInternalOpen(false);
        }
      };

      // Use capture and passive for better performance and immediate execution
      overflowContainer.addEventListener('scroll', handleScroll, {
        passive: true,
        capture: true,
      });

      return () => {
        overflowContainer.removeEventListener('scroll', handleScroll, { capture: true });
      };
    }, [overflowContainer, open, isControlled, controlledOnClose]);

    const handleTooltipClose = React.useCallback(() => {
      if (isControlled) {
        controlledOnClose?.();
      } else {
        setInternalOpen(false);
      }
    }, [isControlled, controlledOnClose]);

    const handleTooltipOpen = React.useCallback(() => {
      if (isControlled) {
        controlledOnOpen?.();
      } else {
        setInternalOpen(true);
      }
    }, [isControlled, controlledOnOpen]);

    const defaultSlotProps = React.useMemo<MuiTooltipProps['slotProps']>(
      () => ({
        popper: {
          container: portalContainer,
        },
        tooltip: {
          sx: {
            maxWidth: '300px',
            backgroundColor: 'var(--color-foreground)',
            color: 'var(--color-background)',
            padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingS}`,
            borderRadius: token.Border.BorderRadiusM,
            fontSize: token.FontFamily.FontSSize,
            lineHeight: token.FontFamily.FontSLineHeight,
            '& > *': {
              display: 'block',
              marginBottom: token.Spacing.SpacingMicro,
              '&:last-child': {
                marginBottom: 0,
              },
            },
          },
        },
      }),
      [portalContainer]
    );

    const mergedSlotProps = React.useMemo<MuiTooltipProps['slotProps']>(
      () =>
        customSlotProps
          ? {
              popper: {
                ...defaultSlotProps?.popper,
                ...customSlotProps.popper,
              },
              tooltip: {
                ...defaultSlotProps?.tooltip,
                ...customSlotProps.tooltip,
              },
            }
          : defaultSlotProps,
      [defaultSlotProps, customSlotProps]
    );

    return (
      <Tooltip
        ref={tooltipRef}
        title={title}
        open={open}
        onClose={handleTooltipClose}
        onOpen={handleTooltipOpen}
        disableInteractive={disableInteractive}
        placement={placement}
        enterDelay={enterDelay}
        enterNextDelay={enterNextDelay}
        TransitionProps={{ timeout: 0 }}
        slotProps={mergedSlotProps}
      >
        {children}
      </Tooltip>
    );
  }
);
