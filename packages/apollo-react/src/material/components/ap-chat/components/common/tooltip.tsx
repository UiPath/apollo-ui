import {
    Tooltip,
    TooltipProps as MuiTooltipProps,
} from '@mui/material';
import token from '@uipath/apollo-core';
import React from 'react';

import { useChatScroll } from '../../providers/chat-scroll-provider';

export interface AutopilotChatTooltipProps {
    title: React.ReactNode;
    disableInteractive?: boolean;
    children: React.ReactElement;
    placement?: MuiTooltipProps['placement'];
}

export const AutopilotChatTooltip: React.FC<AutopilotChatTooltipProps> = React.memo(({
    title,
    disableInteractive = false,
    placement = 'bottom',
    children,
}) => {
    const [ open, setOpen ] = React.useState(false);
    const { overflowContainer } = useChatScroll();
    const tooltipRef = React.useRef<HTMLDivElement>(null);

    // Close the tooltip immediately at the first sign of scrolling
    React.useEffect(() => {
        if (!overflowContainer || !open) {
            return undefined;
        }

        const handleScroll = () => {
            setOpen(false);
        };

        // Use capture and passive for better performance and immediate execution
        overflowContainer.addEventListener('scroll', handleScroll, {
            passive: true,
            capture: true,
        });

        return () => {
            overflowContainer.removeEventListener('scroll', handleScroll, { capture: true });
        };
    }, [ overflowContainer, open ]);

    const handleTooltipClose = React.useCallback(() => {
        setOpen(false);
    }, []);

    const handleTooltipOpen = React.useCallback(() => {
        setOpen(true);
    }, []);

    return (
        <Tooltip
            ref={tooltipRef}
            title={title}
            open={open}
            onClose={handleTooltipClose}
            onOpen={handleTooltipOpen}
            disableInteractive={disableInteractive}
            placement={placement}
            TransitionProps={{ timeout: 0 }}
            slotProps={{
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
            }}
        >
            {children}
        </Tooltip>
    );
});
