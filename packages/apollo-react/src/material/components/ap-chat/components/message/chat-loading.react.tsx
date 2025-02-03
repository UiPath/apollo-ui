/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import {
    AutopilotChatEvent,
    AutopilotChatInternalEvent,
    AutopilotChatMode,
} from '../../models/chat.model';
import { useLoading } from '../../providers/loading-provider.react';
import { AutopilotChatInternalService } from '../../services/chat-internal-service';
import { AutopilotChatService } from '../../services/chat-service';
import { StorageService } from '../../services/storage';
import {
    CHAT_MESSAGE_MAX_PADDING,
    CHAT_WIDTH_KEY,
    CHAT_WIDTH_SIDE_BY_SIDE_MIN,
} from '../../utils/constants';
import { calculateDynamicPadding } from '../../utils/dynamic-padding';

const LoadingContainer = styled('div')(({ theme }) => {
    const [ padding, setPadding ] = React.useState(
        calculateDynamicPadding(parseInt(StorageService.Instance.get(CHAT_WIDTH_KEY) ?? CHAT_WIDTH_SIDE_BY_SIDE_MIN.toString(), 10)),
    );

    React.useEffect(() => {
        const unsubscribe = AutopilotChatInternalService.Instance.on(AutopilotChatInternalEvent.ChatResize, (width: number) => {
            setPadding(calculateDynamicPadding(width));
        });

        const unsubscribeMode = AutopilotChatService.Instance.on(
            AutopilotChatEvent.ModeChange, (mode: AutopilotChatMode) => {
                if (mode === AutopilotChatMode.FullScreen) {
                    setPadding(CHAT_MESSAGE_MAX_PADDING);
                } else {
                    const defaultWidth = CHAT_WIDTH_SIDE_BY_SIDE_MIN.toString();
                    const storedWidth = StorageService.Instance.get(CHAT_WIDTH_KEY) ?? defaultWidth;
                    const width = parseInt(storedWidth, 10);

                    setPadding(calculateDynamicPadding(width));
                }
            });

        return () => {
            unsubscribe();
            unsubscribeMode();
        };
    }, []);

    return {
        display: 'flex',
        padding: token.Spacing.SpacingBase,
        paddingRight: `calc(${token.Spacing.SpacingBase} + ${token.Spacing.SpacingXl})`,
        flexDirection: 'column',
        justifyContent: 'center',
        alignSelf: 'flex-start',
        gap: token.Spacing.SpacingMicro,
        borderRadius: token.Border.BorderRadiusL,
        backgroundColor: 'unset',
        marginRight: token.Spacing.SpacingL,
        maxWidth: `calc(100% - ${token.Spacing.SpacingL} * 2 - ${padding}px)`, // margin of parent + dynamic padding based on side by side width
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        color: theme.palette.semantic.colorForeground,
    };
});

export function AutopilotChatLoading() {
    const { waitingResponse } = useLoading();

    if (!waitingResponse) {
        return null;
    }

    return (
        <LoadingContainer>
            <ap-typography>{t('autopilot-chat-thinking')}</ap-typography>
        </LoadingContainer>
    );
}
