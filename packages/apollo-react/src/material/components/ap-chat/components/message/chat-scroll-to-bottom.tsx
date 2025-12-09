import React from 'react';

import { styled } from '@mui/material';
import token from '@uipath/apollo-core';

import { t } from '../../../../utils/localization/loc';
import { useChatScroll } from '../../providers/chat-scroll-provider';
import { useChatService } from '../../providers/chat-service.provider';
import {
  AutopilotChatEvent,
  AutopilotChatInternalEvent,
} from '../../service';
import { AutopilotChatActionButton } from '../common/action-button';

const ScrollButtonContainer = styled('div')<{ visible: boolean; bottom: number; left: number }>(({
    theme, visible, bottom, left,
}) => ({
    position: 'fixed',
    bottom,
    left,
    zIndex: 1,
    transitionProperty: 'opacity',
    transitionDuration: '0.3s',
    transitionTimingFunction: 'ease-in-out',
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? 'auto' : 'none',
    '& .MuiIconButton-root': {
        backgroundColor: theme.palette.semantic.colorBackground,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',

        '&:hover,&:focus': {
            backgroundColor: `${theme.palette.semantic.colorHover} !important`,
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
        },

        '&:active': { backgroundColor: `${theme.palette.semantic.colorHover} !important` },
    },
}));

const ScrollButtonWrapper = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: token.Spacing.SpacingXxl,
    height: token.Spacing.SpacingXxl,
    backgroundColor: 'transparent',
}));

interface ScrollToBottomButtonProps {
    overflowContainer: HTMLDivElement | null;
}

function AutopilotChatScrollToBottomButtonComponent({ overflowContainer }: ScrollToBottomButtonProps) {
    const [ bottom, setBottom ] = React.useState(0);
    const [ left, setLeft ] = React.useState(0);
    const {
        autoScroll, scrollToBottom,
    } = useChatScroll();

    const chatService = useChatService();
    const chatInternalService = chatService.__internalService__;

    React.useEffect(() => {
        if (!chatService || !chatInternalService) {
            return;
        }

        let animationFrameRef: number | null = null;

        const updatePosition = () => {
            animationFrameRef = requestAnimationFrame(() => {
                if (overflowContainer) {
                    const rect = overflowContainer.getBoundingClientRect();

                    setBottom(Math.round(window.innerHeight - rect.bottom));
                    setLeft(Math.round(rect.left + rect.width / 2 - parseInt(token.Spacing.SpacingM, 10)));
                }
            });
        };

        // Delay to ensure the overflow container is rendered properly
        const timeout = setTimeout(() => {
            updatePosition();
        }, 200);

        window.addEventListener('resize', updatePosition);
        const unsubscribeResize = chatInternalService.on(AutopilotChatInternalEvent.ChatResize, updatePosition);
        const unsubscribeModeChange = chatService.on(AutopilotChatEvent.ModeChange, updatePosition);

        return () => {
            window.removeEventListener('resize', updatePosition);
            unsubscribeResize();
            unsubscribeModeChange();

            if (animationFrameRef) {
                cancelAnimationFrame(animationFrameRef);
            }

            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [ overflowContainer, chatInternalService, chatService, bottom ]);

    const isVisible = !autoScroll;

    return (
        <ScrollButtonContainer visible={isVisible} bottom={bottom} left={left}>
            <ScrollButtonWrapper>
                <AutopilotChatActionButton
                    iconName="arrow_downward"
                    onClick={() => scrollToBottom({ force: true })}
                    ariaLabel={t('autopilot-chat-scroll-to-bottom')}
                    tooltip={isVisible ? t('autopilot-chat-scroll-to-bottom') : undefined}
                    tabIndex={isVisible ? 0 : -1}
                    data-testid="autopilot-chat-scroll-to-bottom"
                />
            </ScrollButtonWrapper>
        </ScrollButtonContainer>
    );
}

export const AutopilotChatScrollToBottomButton = React.memo(AutopilotChatScrollToBottomButtonComponent);
