/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Tooltip,
    TooltipProps as MuiTooltipProps,
} from '@mui/material';
import React from 'react';

import { useChatScroll } from '../../providers/chat-scroll-provider.react';

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
    const { overflowContainerRef } = useChatScroll();
    const tooltipRef = React.useRef<HTMLDivElement>(null);

    // Close the tooltip immediately at the first sign of scrolling
    React.useEffect(() => {
        const container = overflowContainerRef.current;

        if (!container || !open) {
            return undefined;
        }

        const handleScroll = () => {
            setOpen(false);
        };

        // Use capture and passive for better performance and immediate execution
        container.addEventListener('scroll', handleScroll, {
            passive: true,
            capture: true,
        });

        return () => {
            container.removeEventListener('scroll', handleScroll, { capture: true });
        };
    }, [ overflowContainerRef, open ]);

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
        >
            {children}
        </Tooltip>
    );
});
