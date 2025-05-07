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
    const isUserInteractingWithActions = React.useRef(false);
    const actionsContainerRef = React.useRef<HTMLDivElement | null>(null);

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
            isVisible={isVisible}
            setIsVisible={setIsVisible}
            onHoverChange={handleActionsHoverChange}
            actionsContainerRef={handleActionContainerRef}
        />
    );
}

export const AutopilotChatMessageActions = React.memo(AutopilotChatMessageActionsComponent);
