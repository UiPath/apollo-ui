/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    AutopilotChatEvent,
    AutopilotChatMessage,
    AutopilotChatRole,
} from '@uipath/portal-shell-util';
import React from 'react';

import { t } from '../../../../../utils/localization/loc';
import { AutopilotChatActionsList } from './chat-actions-list.react';

interface AutopilotChatMessageActionsProps {
    message: AutopilotChatMessage;
    containerElement?: HTMLDivElement | null;
}

function AutopilotChatMessageActionsComponent({
    message, containerElement,
}: AutopilotChatMessageActionsProps) {
    const [ isVisible, setIsVisible ] = React.useState(false);

    // Determine actions based on message role and existing feedback
    const defaultActions = React.useMemo(() => {
        const baseActions = [
            {
                name: 'autopilot-chat-copy',
                label: t('autopilot-chat-copy'),
                icon: 'copy',
                eventName: AutopilotChatEvent.Copy,
            },
        ];

        // If not an assistant message, just return copy action
        if (message.role !== AutopilotChatRole.Assistant) {
            return baseActions;
        }

        // If message has feedback, show only the relevant thumbs button and use filled icon
        if (message.feedback) {
            const { isPositive } = message.feedback;

            return [
                ...baseActions,
                {
                    name: isPositive ? 'autopilot-chat-good' : 'autopilot-chat-bad',
                    label: isPositive ? t('autopilot-chat-good') : t('autopilot-chat-bad'),
                    icon: isPositive ? 'thumb_up' : 'thumb_down',
                    disabled: true,
                },
            ];
        }

        // Otherwise show both feedback options
        return [
            ...baseActions,
            {
                name: 'autopilot-chat-good',
                label: t('autopilot-chat-good'),
                icon: 'thumb_up',
                eventName: AutopilotChatEvent.Feedback,
                details: { isPositive: true },
            },
            {
                name: 'autopilot-chat-bad',
                label: t('autopilot-chat-bad'),
                icon: 'thumb_down',
                eventName: AutopilotChatEvent.Feedback,
                details: { isPositive: false },
            },
        ];
    }, [ message ]);

    React.useEffect(() => {
        const messageContainer = containerElement;

        if (!messageContainer) {
            return;
        }

        const handleMouseEnter = () => setIsVisible(true);
        const handleMouseLeave = () => setIsVisible(false);
        const handleFocus = () => setIsVisible(true);
        const handleBlur = () => setIsVisible(false);

        // Add event listeners to the parent message container
        messageContainer.addEventListener('mouseenter', handleMouseEnter);
        messageContainer.addEventListener('mouseleave', handleMouseLeave);
        messageContainer.addEventListener('focusin', handleFocus);
        messageContainer.addEventListener('focusout', handleBlur);

        return () => {
            messageContainer.removeEventListener('mouseenter', handleMouseEnter);
            messageContainer.removeEventListener('mouseleave', handleMouseLeave);
            messageContainer.removeEventListener('focusin', handleFocus);
            messageContainer.removeEventListener('focusout', handleBlur);
        };
    }, [ containerElement ]);

    if (message.stream && !message.done) {
        return null;
    }

    return (
        <AutopilotChatActionsList
            message={{
                ...message,
                actions: [
                    ...defaultActions,
                    ...(message.actions ?? []),
                ],
            }}
            isVisible={isVisible}
            setIsVisible={setIsVisible}
        />
    );
}

export const AutopilotChatMessageActions = React.memo(AutopilotChatMessageActionsComponent);
