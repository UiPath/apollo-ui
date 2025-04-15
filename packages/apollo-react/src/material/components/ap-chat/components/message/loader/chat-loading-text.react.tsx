/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { Fade } from '@mui/material';
import { AutopilotChatEvent } from '@uipath/portal-shell-util';
import React, {
    useEffect,
    useState,
} from 'react';

import { t } from '../../../../../utils/localization/loc';
import { AutopilotChatService } from '../../../services/chat-service';

const SECONDS = 1000;
const FADE_DURATION = 0.5 * SECONDS;
const DEFAULT_MESSAGE_DURATION = 5 * SECONDS;

const defaultMessages = [ 'autopilot-chat-thinking', 'autopilot-chat-analyzing', 'autopilot-chat-thinking-more' ];

export const LoadingMessage = () => {
    const [ messageIdx, setMessageIdx ] = useState(0);
    const [ isVisible, setIsVisible ] = useState(true);
    const [ messages, setMessages ] = useState(defaultMessages);
    const [ messageDuration, setMessageDuration ] = useState(DEFAULT_MESSAGE_DURATION);
    const chatService = AutopilotChatService.Instance;

    useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribeSetDefaultLoadingMessages = chatService.on(
            AutopilotChatEvent.SetDefaultLoadingMessages, (data: { messages: string[]; duration?: number }) => {
                setIsVisible(false);
                setTimeout(() => {
                    setMessageIdx(0);
                    setMessages(data.messages);
                    setMessageDuration(data.duration ?? DEFAULT_MESSAGE_DURATION);
                    setIsVisible(true);
                }, FADE_DURATION);
            });

        const unsubscribeSetLoadingMessage = chatService.on(AutopilotChatEvent.SetLoadingMessage, (message: string) => {
            setIsVisible(false);
            setTimeout(() => {
                setMessageIdx(0);
                setMessages([ message ]);
                setIsVisible(true);
            }, FADE_DURATION);
        });

        return () => {
            unsubscribeSetDefaultLoadingMessages();
            unsubscribeSetLoadingMessage();
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
            <ap-typography>{t(messages[messageIdx])}</ap-typography>
        </Fade>
    );
};
