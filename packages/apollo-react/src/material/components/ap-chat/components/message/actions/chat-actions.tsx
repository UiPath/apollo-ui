import { useIsStreamingMessage } from '@uipath/apollo-react/chat/headless/hooks/use-is-streaming-message';
import {
  useDefaultMessageActions,
  useIsLastAssistantMessage,
} from '@uipath/apollo-react/chat/headless/hooks/use-message-actions';
import type { AutopilotChatMessage } from '@uipath/apollo-react/chat/service';
import React from 'react';
import { AutopilotChatActionsList } from './chat-actions-list';

interface AutopilotChatMessageActionsProps {
  message: AutopilotChatMessage;
  containerElement?: HTMLDivElement | null;
}

function AutopilotChatMessageActionsComponent({
  message,
  containerElement,
}: AutopilotChatMessageActionsProps) {
  const isLastAssistantMessage = useIsLastAssistantMessage(message);
  const [isVisible, setIsVisible] = React.useState(false);
  const isUserInteractingWithActions = React.useRef(false);
  const actionsContainerRef = React.useRef<HTMLDivElement | null>(null);
  const { isStreaming } = useIsStreamingMessage(message);
  const defaultActions = useDefaultMessageActions(message);

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
