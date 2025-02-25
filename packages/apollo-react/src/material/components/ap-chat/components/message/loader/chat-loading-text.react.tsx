/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { Fade } from '@mui/material';
import React, {
    useEffect,
    useState,
} from 'react';

import { t } from '../../../../../utils/localization/loc';

const SECONDS = 1000;
const FADE_DURATION = 0.5 * SECONDS;
const MESSAGE_DURATION = 5 * SECONDS;

const messages = [ 'autopilot-chat-thinking', 'autopilot-chat-analyzing', 'autopilot-chat-thinking-more' ];

export const LoadingMessage = () => {
    const [ messageIdx, setMessageIdx ] = useState(0);
    const [ isVisible, setIsVisible ] = useState(true);

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
    }, [ messageIdx ]);

    return (
        <Fade in={isVisible} timeout={FADE_DURATION}>
            <ap-typography>{t(messages[messageIdx])}</ap-typography>
        </Fade>
    );
};
