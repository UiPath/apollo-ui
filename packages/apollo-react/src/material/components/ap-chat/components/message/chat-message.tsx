import { styled } from '@mui/material';
import token from '@uipath/apollo-core';
import React, { useMemo } from 'react';

import { useChatService } from '../../providers/chat-service.provider';
import { useChatState } from '../../providers/chat-state-provider';
import { useLoading } from '../../providers/loading-provider';
import {
  type AutopilotChatActionPayload,
  AutopilotChatEvent,
  AutopilotChatInterceptableEvent,
  AutopilotChatInternalEvent,
  type AutopilotChatMessage,
  AutopilotChatRole,
  type AutopilotChatSuggestion,
} from '../../service';
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

const removeFakeStream = (messages: AutopilotChatMessage[]) => {
  return messages.map(({ fakeStream: _fakeStream, ...rest }) => rest);
};

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
  const [messages, setMessages] = React.useState<AutopilotChatMessage[]>(
    removeFakeStream(chatService?.getConversation?.() ?? [])
  );

  const { isLoadingMoreMessages, skeletonLoader } = useLoading();

  const { firstRunExperience, setHasMessages, spacing } = useChatState();

  const [suggestions, setSuggestions] = React.useState<AutopilotChatSuggestion[]>([]);
  const [sendOnClick, setSendOnClick] = React.useState<boolean>(false);

  // Update by patching if the message already exists or adding to the end of the array
  const updateMessages = React.useCallback((message: AutopilotChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) {
        return prev.map((m) => (m.id === message.id ? message : m));
      }
      return [...prev, message];
    });
  }, []);

  const sendFeedback = React.useCallback(
    ({ message, action }: AutopilotChatActionPayload) => {
      if (!chatService) {
        return;
      }

      if (message.role === AutopilotChatRole.Assistant) {
        chatService.sendResponse({
          ...message,
          ...(message.fakeStream ? { fakeStream: false } : {}),
          ...(message.stream
            ? {
                stream: false,
                done: true,
              }
            : {}),
          feedback: { isPositive: !!action.details?.isPositive },
        } satisfies AutopilotChatMessage);
      }
    },
    [chatService]
  );

  const onCopy = React.useCallback(({ group, message }: AutopilotChatActionPayload) => {
    let finalString = '';

    if (group.length === 0) {
      finalString = message.toCopy ?? message.content;
    } else {
      finalString = group.map((msg) => msg.toCopy ?? msg.content).join('\n');
    }

    if (navigator.clipboard && finalString) {
      navigator.clipboard.writeText(finalString).catch(() => {});
    }
  }, []);

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    // use an interceptor to add the message to the messages array so the chat doesn't have to wait for the consumer confirmation
    const unsubscribeRequest = chatService.intercept(
      AutopilotChatInterceptableEvent.Request,
      updateMessages
    );
    const unsubscribeResponse = chatService.on(AutopilotChatEvent.Response, updateMessages);
    const unsubscribeNewChat = chatService.on(AutopilotChatEvent.NewChat, () => setMessages([]));
    const unsubscribeFeedback = chatService.on(AutopilotChatEvent.Feedback, sendFeedback);
    const unsubscribeCopy = chatService.on(AutopilotChatEvent.Copy, onCopy);
    // set messages to the new conversation
    const unsubscribeConversation = chatService.on(AutopilotChatEvent.SetConversation, (msg) => {
      setMessages(removeFakeStream(msg));
    });
    const unsubscribeSetSuggestions = chatService.__internalService__.on(
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

    return () => {
      unsubscribeRequest();
      unsubscribeResponse();
      unsubscribeConversation();
      unsubscribeNewChat();
      unsubscribeFeedback();
      unsubscribeCopy();
      unsubscribeSetSuggestions();
    };
  }, [chatService, updateMessages, sendFeedback, onCopy]);

  const messageGroups = useMemo(() => {
    return messages.reduce((acc, message, index) => {
      if (!message.groupId) {
        acc.push([message]);
      } else if (index > 0 && messages[index - 1]?.groupId === message.groupId) {
        acc[acc.length - 1]!.push(message);
      } else {
        acc.push([message]);
      }

      return acc;
    }, [] as AutopilotChatMessage[][]);
  }, [messages]);

  React.useEffect(() => {
    setHasMessages(messages.length > 0);
  }, [messages, setHasMessages]);

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
