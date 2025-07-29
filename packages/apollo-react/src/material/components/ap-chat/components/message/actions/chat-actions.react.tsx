/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    AutopilotChatEvent,
    AutopilotChatMessage,
    AutopilotChatRole,
} from '@uipath/portal-shell-util';
import React, { useEffect } from 'react';

import { t } from '../../../../../utils/localization/loc';
import { useChatService } from '../../../providers/chat-service.provider.react';
import { useChatState } from '../../../providers/chat-state-provider.react';
import { AutopilotChatActionsList } from './chat-actions-list.react';

interface AutopilotChatMessageActionsProps {
    message: AutopilotChatMessage;
    containerElement?: HTMLDivElement | null;
}

function AutopilotChatMessageActionsComponent({
    message, containerElement,
}: AutopilotChatMessageActionsProps) {
    const chatService = useChatService();
    const { disabledFeatures } = useChatState();
    const [ isLastAssistantMessage, setIsLastAssistantMessage ] = React.useState(false);
    const [ isVisible, setIsVisible ] = React.useState(false);
    const isUserInteractingWithActions = React.useRef(false);
    const actionsContainerRef = React.useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!chatService) {
            return;
        }

        const assistantMessages = chatService.getConversation?.()?.filter((m) => m.role === AutopilotChatRole.Assistant);
        const lastAssistantMessage = assistantMessages?.[assistantMessages.length - 1];

        if (lastAssistantMessage?.id === message.id || lastAssistantMessage?.groupId === message.groupId) {
            setIsLastAssistantMessage(true);
        }

        const unsubscribeResponse = chatService.on(AutopilotChatEvent.Response, (response: AutopilotChatMessage) => {
            setIsLastAssistantMessage(response.id === lastAssistantMessage?.id || response.groupId === lastAssistantMessage?.groupId);
        });

        return () => {
            unsubscribeResponse();
        };
    }, [ chatService, message ]);

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
        if (message.role !== AutopilotChatRole.Assistant || disabledFeatures.feedback) {
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

    }, [ message, disabledFeatures.feedback ]);

    const isRelatedTarget = React.useCallback((target: Node) => {
        return actionsContainerRef.current && (
            actionsContainerRef.current === target ||
            actionsContainerRef.current.contains(target)
        );
    }, []);

    // Store a reference to the actions container
    const handleActionContainerRef = React.useCallback((node: HTMLDivElement | null) => {
        actionsContainerRef.current = node;
    }, []);

    // Handler for actions list hover state
    const handleActionsHoverChange = React.useCallback((isHovering: boolean) => {
        isUserInteractingWithActions.current = isHovering;

        if (isHovering) {
            setIsVisible(true);
        }
    }, []);

    React.useEffect(() => {
        if (!containerElement) {
            return;
        }

        const handleMouseEnter = () => setIsVisible(true);

        const handleMouseLeave = (event: MouseEvent) => {
            // If actions list is open, don't hide it
            if (isUserInteractingWithActions.current) {
                return;
            }

            // Check if the mouse is moving to the actions container or its children
            if (isRelatedTarget(event.relatedTarget as Node)) {
                return;
            }

            setIsVisible(false);
        };

        const handleFocus = () => setIsVisible(true);
        const handleBlur = (event: FocusEvent) => {
            const relatedTarget = event.relatedTarget as Node;

            // Check if the mouse is moving to the actions container or its children
            if (isRelatedTarget(relatedTarget) || containerElement.contains(relatedTarget)) {
                return;
            }

            setIsVisible(false);
        };

        // Add event listeners to the parent message container
        containerElement.addEventListener('mouseenter', handleMouseEnter);
        containerElement.addEventListener('mouseleave', handleMouseLeave);
        containerElement.addEventListener('focusin', handleFocus);
        containerElement.addEventListener('focusout', handleBlur);

        return () => {
            containerElement.removeEventListener('mouseenter', handleMouseEnter);
            containerElement.removeEventListener('mouseleave', handleMouseLeave);
            containerElement.removeEventListener('focusin', handleFocus);
            containerElement.removeEventListener('focusout', handleBlur);
        };
    }, [ containerElement, isRelatedTarget ]);

    if (message.stream && !message.done) {
        return null;
    }

    return (
        <AutopilotChatActionsList
            message={message}
            defaultActions={defaultActions}
            isVisible={isVisible || isLastAssistantMessage}
            setIsVisible={setIsVisible}
            onHoverChange={handleActionsHoverChange}
            actionsContainerRef={handleActionContainerRef}
        />
    );
}

export const AutopilotChatMessageActions = React.memo(AutopilotChatMessageActionsComponent);
