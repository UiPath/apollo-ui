/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Fade,
    useTheme,
} from '@mui/material';
import { AutopilotChatEvent } from '@uipath/portal-shell-util';
import React, {
    useEffect,
    useState,
} from 'react';

import { t } from '../../../../../utils/localization/loc';
import { useChatService } from '../../../providers/chat-service.provider.react';
import { useChatState } from '../../../providers/chat-state-provider.react';

const SECONDS = 1000;
const FADE_DURATION = 0.5 * SECONDS;
const DEFAULT_MESSAGE_DURATION = 5 * SECONDS;

const defaultMessages = [ 'autopilot-chat-generating-response' ];

export const LoadingMessage = () => {
    const chatService = useChatService();
    const [ messageIdx, setMessageIdx ] = useState(0);
    const [ isVisible, setIsVisible ] = useState(true);
    const [ messages, setMessages ] = useState(chatService.getDefaultLoadingMessages() ?? defaultMessages);
    const [ messageDuration, setMessageDuration ] = useState(chatService.getLoadingMessageDuration() ?? DEFAULT_MESSAGE_DURATION);
    const { spacing } = useChatState();
    const theme = useTheme();

    useEffect(() => {
        if (!chatService) {
            return;
        }

        let setDefaultLoadingMessagesTimeout: NodeJS.Timeout | undefined = undefined;
        let setLoadingMessageTimeout: NodeJS.Timeout | undefined = undefined;

        const unsubscribeSetDefaultLoadingMessages = chatService.on(
            AutopilotChatEvent.SetDefaultLoadingMessages, (data: { messages: string[]; duration?: number }) => {
                setIsVisible(false);
                setDefaultLoadingMessagesTimeout = setTimeout(() => {
                    setMessageIdx(0);
                    setMessages(data.messages);
                    setMessageDuration(data.duration ?? DEFAULT_MESSAGE_DURATION);
                    setIsVisible(true);
                }, FADE_DURATION);
            });

        const unsubscribeSetLoadingMessage = chatService.on(AutopilotChatEvent.SetLoadingMessage, (message: string) => {
            setIsVisible(false);
            setLoadingMessageTimeout = setTimeout(() => {
                setMessageIdx(0);
                setMessages([ message ]);
                setIsVisible(true);
            }, FADE_DURATION);
        });

        return () => {
            unsubscribeSetDefaultLoadingMessages();
            unsubscribeSetLoadingMessage();
            clearTimeout(setDefaultLoadingMessagesTimeout);
            clearTimeout(setLoadingMessageTimeout);
        };
    }, [ chatService ]);

    useEffect(() => {
        if (messages.length === 1) {
            return;
        }

        let childTimeout: NodeJS.Timeout | undefined = undefined;

        const parentTimeout = setTimeout(() => {
            setIsVisible(false);
            childTimeout = setTimeout(() => {
                setMessageIdx(prev => prev === messages.length - 1 ? 0 : prev + 1);
                setIsVisible(true);
            }, FADE_DURATION);
        }, messageDuration);

        return () => {
            clearTimeout(parentTimeout);
            clearTimeout(childTimeout);
        };
    }, [ messageIdx, messageDuration, messages ]);

    return (
        <Fade in={isVisible} timeout={FADE_DURATION}>
            <ap-typography
                variant={spacing.primaryFontToken}
                color={theme.palette.semantic.colorForeground}
            >
                {t(messages[messageIdx])}
            </ap-typography>
        </Fade>
    );
};
