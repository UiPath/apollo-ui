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
const MESSAGE_DURATION = 5 * SECONDS;

const defaultMessages = [ 'autopilot-chat-thinking', 'autopilot-chat-analyzing', 'autopilot-chat-thinking-more' ];

export const LoadingMessage = () => {
    const [ messageIdx, setMessageIdx ] = useState(0);
    const [ isVisible, setIsVisible ] = useState(true);
    const [ messages, setMessages ] = useState(defaultMessages);
    const chatService = AutopilotChatService.Instance;

    useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribeSetLoadingMessage = chatService.on(AutopilotChatEvent.SetLoadingMessage, (newMessages: string[]) => {
            setIsVisible(false);
            setTimeout(() => {
                setMessages(newMessages);
                setMessageIdx(0);
                setIsVisible(true);
            }, FADE_DURATION);
        });

        return () => {
            unsubscribeSetLoadingMessage();
        };
    }, [ chatService ]);

    useEffect(() => {
        if (messageIdx >= messages.length - 1) {
            return;
        }

        let childTimeout: NodeJS.Timeout | undefined = undefined;

        const parentTimeout = setTimeout(() => {
            setIsVisible(false);
            childTimeout = setTimeout(() => {
                setMessageIdx(prev => prev + 1);
                setIsVisible(true);
            }, FADE_DURATION);
        }, MESSAGE_DURATION);

        return () => {
            clearTimeout(parentTimeout);
            clearTimeout(childTimeout);
        };
    }, [ messageIdx, messages ]);

    return (
        <Fade in={isVisible} timeout={FADE_DURATION}>
            <ap-typography>{t(messages[messageIdx])}</ap-typography>
        </Fade>
    );
};
