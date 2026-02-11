import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import React, { useEffect } from 'react';
import { useIsStreamingMessage } from '../../../hooks/use-is-streaming-message';
import { useChatService } from '../../../providers/chat-service.provider';
import { useChatState } from '../../../providers/chat-state-provider';
import {
  AutopilotChatEvent,
  type AutopilotChatMessage,
  AutopilotChatPreHookAction,
  AutopilotChatRole,
} from '../../../service';
import { AutopilotChatActionsList } from './chat-actions-list';

interface AutopilotChatMessageActionsProps {
  message: AutopilotChatMessage;
  containerElement?: HTMLDivElement | null;
}

function AutopilotChatMessageActionsComponent({
  message,
  containerElement,
}: AutopilotChatMessageActionsProps) {
  const { _ } = useLingui();
  const chatService = useChatService();
  const { disabledFeatures, readOnly } = useChatState();
  const [isLastAssistantMessage, setIsLastAssistantMessage] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const isUserInteractingWithActions = React.useRef(false);
  const actionsContainerRef = React.useRef<HTMLDivElement | null>(null);
  const { isStreaming } = useIsStreamingMessage(message);

  useEffect(() => {
    if (!chatService) {
      return;
    }

    const assistantMessages = chatService
      .getConversation?.()
      ?.filter((m) => m.role === AutopilotChatRole.Assistant);
    const lastAssistantMessage = assistantMessages?.[assistantMessages.length - 1];

    if (
      lastAssistantMessage?.id === message.id ||
      lastAssistantMessage?.groupId === message.groupId
    ) {
      setIsLastAssistantMessage(true);
    }

    const unsubscribeResponse = chatService.on(
      AutopilotChatEvent.Response,
      (response: AutopilotChatMessage) => {
        setIsLastAssistantMessage(
          response.id === lastAssistantMessage?.id ||
            response.groupId === lastAssistantMessage?.groupId
        );
      }
    );

    return () => {
      unsubscribeResponse();
    };
  }, [chatService, message]);

  // Determine actions based on message role and existing feedback
  const defaultActions = React.useMemo(() => {
    const baseActions: Array<{ name: string; label: string; icon: string; eventName: string }> = [];

    if (!disabledFeatures.copy) {
      baseActions.push({
        name: 'autopilot-chat-copy',
        label: _(msg({ id: 'autopilot-chat.message.actions.copy', message: `Copy` })),
        icon: 'content_copy',
        eventName: AutopilotChatEvent.Copy,
      });
    }

    // If not an assistant message, just return copy action
    if (message.role !== AutopilotChatRole.Assistant || readOnly || disabledFeatures.feedback) {
      return baseActions;
    }

    // If message has feedback, show only the relevant thumbs button and use filled icon
    if (message.feedback) {
      const { isPositive } = message.feedback;

      return [
        ...baseActions,
        {
          name: isPositive ? 'autopilot-chat-good' : 'autopilot-chat-bad',
          label: isPositive
            ? _(msg({ id: 'autopilot-chat.message.actions.good', message: `Good response` }))
            : _(msg({ id: 'autopilot-chat.message.actions.bad', message: `Bad response` })),
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
        label: _(msg({ id: 'autopilot-chat.message.actions.good', message: `Good response` })),
        icon: 'thumb_up',
        eventName: AutopilotChatEvent.Feedback,
        details: {
          isPositive: true,
          preHookAction: AutopilotChatPreHookAction.Feedback,
        },
      },
      {
        name: 'autopilot-chat-bad',
        label: _(msg({ id: 'autopilot-chat.message.actions.bad', message: `Bad response` })),
        icon: 'thumb_down',
        eventName: AutopilotChatEvent.Feedback,
        details: {
          isPositive: false,
          preHookAction: AutopilotChatPreHookAction.Feedback,
        },
      },
    ];
  }, [message, readOnly, disabledFeatures.feedback, disabledFeatures.copy, _]);

  const isRelatedTarget = React.useCallback((target: Node) => {
    return (
      actionsContainerRef.current &&
      (actionsContainerRef.current === target || actionsContainerRef.current.contains(target))
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
  }, [containerElement, isRelatedTarget]);

  if (isStreaming) {
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
