/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatEvent,
    AutopilotChatInternalEvent,
} from '@uipath/portal-shell-util';
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { AutopilotChatInternalService } from '../../services/chat-internal-service';
import { AutopilotChatService } from '../../services/chat-service';
import { AutopilotChatActionButton } from '../common/action-button.react';

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
    visible: boolean;
    onClick: () => void;
    containerRef: React.RefObject<HTMLDivElement>;
}

function AutopilotChatScrollToBottomButtonComponent({
    visible, onClick, containerRef,
}: ScrollToBottomButtonProps) {
    const [ bottom, setBottom ] = React.useState(0);
    const [ left, setLeft ] = React.useState(0);

    const chatService = AutopilotChatService.Instance;
    const chatInternalService = AutopilotChatInternalService.Instance;

    React.useEffect(() => {
        if (!chatService || !chatInternalService) {
            return;
        }

        const updatePosition = () => {
            requestAnimationFrame(() => {
                if (containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();

                    if (!bottom) {
                        const spacing = parseInt(token.Spacing.SpacingXs, 10);
                        setBottom(Math.round(window.innerHeight - rect.bottom + spacing));
                    }

                    setLeft(Math.round(rect.left + rect.width / 2));
                }
            });
        };

        updatePosition();

        window.addEventListener('resize', updatePosition);
        const unsubscribeResize = chatInternalService.on(AutopilotChatInternalEvent.ChatResize, updatePosition);
        const unsubscribeModeChange = chatService.on(AutopilotChatEvent.ModeChange, updatePosition);

        return () => {
            window.removeEventListener('resize', updatePosition);
            unsubscribeResize();
            unsubscribeModeChange();
        };
    }, [ containerRef, chatInternalService, chatService, bottom ]);

    return (
        <ScrollButtonContainer visible={visible} bottom={bottom} left={left}>
            <ScrollButtonWrapper>
                <AutopilotChatActionButton
                    iconName="arrow_downward"
                    onClick={onClick}
                    ariaLabel={t('autopilot-chat-scroll-to-bottom')}
                    tooltip={visible ? t('autopilot-chat-scroll-to-bottom') : undefined}
                    tabIndex={visible ? 0 : -1}
                />
            </ScrollButtonWrapper>
        </ScrollButtonContainer>
    );
}

export const AutopilotChatScrollToBottomButton = React.memo(AutopilotChatScrollToBottomButtonComponent);
