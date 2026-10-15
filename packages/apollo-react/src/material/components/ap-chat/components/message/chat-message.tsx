import { styled } from '@mui/material';
import token from '@uipath/apollo-core';
import { useChatMessages } from '@uipath/apollo-react/chat/headless/hooks/use-chat-messages';
import { useChatService } from '@uipath/apollo-react/chat/headless/providers/chat-service.provider';
import { useChatState } from '@uipath/apollo-react/chat/headless/providers/chat-state-provider';
import { useLoading } from '@uipath/apollo-react/chat/headless/providers/loading-provider';
import {
  AutopilotChatInternalEvent,
  type AutopilotChatMessage,
  AutopilotChatRole,
  type AutopilotChatSuggestion,
} from '@uipath/apollo-react/chat/service';
import React from 'react';
import { SkeletonLoader } from '../common/skeleton-loader';
import { AutopilotChatMessageContent } from './chat-message-content';
import { AutopilotChatFRE } from './first-run-experience/chat-fre';
import { AutopilotChatLoading } from './loader/chat-loading';
import { AutopilotChatLoadingMessages } from './loader/chat-loading-messages';
import { AutopilotChatSuggestions } from './suggestions/chat-suggestions';

const MessageContainer = styled('div')(
  ({
    isOverflow,
    isContainerWide,
    gap,
  }: {
    isOverflow: boolean;
    isContainerWide: boolean;
    gap: number;
  }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: `${gap}px`,
    height: '100%',

    ...(isOverflow &&
      isContainerWide && {
        position: 'relative',
        // account for the scrollbar when the container is greater than max width
        left: token.Spacing.SpacingXs,
      }),
  })
);

const MessageGroupContainer = styled('div')(
  ({
    isAssistant,
    disableActions,
    isLastGroup,
  }: {
    isAssistant: boolean;
    disableActions: boolean;
    isLastGroup: boolean;
  }) => {
    if (disableActions) {
      return isLastGroup ? { marginBottom: '14px' } : { marginBottom: '-16px' };
    }
    if (isAssistant) {
      return { marginBottom: '30px' };
    }
    return { marginBottom: '14px' };
  }
);

const MessageGroup = React.memo(
  ({ messages, isLastGroup }: { messages: AutopilotChatMessage[]; isLastGroup: boolean }) => {
    const [groupRef, setGroupRef] = React.useState<HTMLDivElement | null>(null);
    const disableActions = messages.length === 1 && !!messages[0]?.disableActions;

    return (
      <MessageGroupContainer
        isAssistant={messages[0]?.role === AutopilotChatRole.Assistant}
        disableActions={disableActions}
        isLastGroup={isLastGroup}
        ref={setGroupRef}
      >
        {messages.map((message, index) => (
          <AutopilotChatMessageContent
            key={message.id}
            message={message}
            disableActions={disableActions}
            isLastInGroup={index === messages.length - 1}
            containerRef={groupRef}
          />
        ))}
      </MessageGroupContainer>
    );
  }
);

function AutopilotChatMessagesComponent({
  isOverflow,
  isContainerWide,
}: {
  isOverflow: boolean;
  isContainerWide: boolean;
}) {
  const chatService = useChatService();
  const { messages, groups: messageGroups } = useChatMessages();
  const { isLoadingMoreMessages, skeletonLoader } = useLoading();
  const { firstRunExperience, spacing } = useChatState();
  const [suggestions, setSuggestions] = React.useState<AutopilotChatSuggestion[]>([]);
  const [sendOnClick, setSendOnClick] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    return chatService.__internalService__.on(
      AutopilotChatInternalEvent.SetSuggestions,
      ({
        suggestions: suggestionsToSet,
        sendOnClick: sendOnClickToSet,
      }: {
        suggestions: AutopilotChatSuggestion[];
        sendOnClick: boolean;
      }) => {
        setSuggestions(suggestionsToSet);
        setSendOnClick(sendOnClickToSet);
      }
    );
  }, [chatService]);

  return (
    <MessageContainer
      gap={spacing.messageSpacing}
      isOverflow={isOverflow}
      isContainerWide={isContainerWide}
    >
      {skeletonLoader ? (
        <SkeletonLoader />
      ) : (
        <>
          {isLoadingMoreMessages && <AutopilotChatLoadingMessages />}
          {messages.length === 0 && <AutopilotChatFRE />}
          {messageGroups.map((group, idx) => (
            <MessageGroup
              key={group[0]?.id}
              messages={group}
              isLastGroup={idx === messageGroups.length - 1}
            />
          ))}
          {messages.length > 0 && suggestions.length > 0 && (
            <AutopilotChatSuggestions
              suggestions={suggestions}
              sendOnClick={sendOnClick ?? firstRunExperience?.sendOnClick ?? false}
              includeTitle={true}
            />
          )}

          <AutopilotChatLoading />
        </>
      )}
    </MessageContainer>
  );
}

export const AutopilotChatMessages = React.memo(AutopilotChatMessagesComponent);
