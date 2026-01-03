import React from 'react';

import {
  AutopilotChatEvent,
  AutopilotChatInterceptableEvent,
  AutopilotChatInternalEvent,
  type AutopilotChatMessage,
  AutopilotChatRole,
} from '../service';
import { useChatService } from './chat-service.provider';

interface AutopilotLoadingContextType {
  waitingResponse: boolean;
  isLoadingMoreMessages: boolean;
  setWaitingResponse: (waitingResponse: boolean) => void;
  showLoading: boolean;
  skeletonLoader: boolean;
}

export const AutopilotLoadingContext = React.createContext<AutopilotLoadingContextType>({
  waitingResponse: false,
  isLoadingMoreMessages: false,
  setWaitingResponse: () => {},
  showLoading: false,
  skeletonLoader: false,
});

export function AutopilotLoadingProvider({ children }: { children: React.ReactNode }) {
  const [waitingResponse, setWaitingResponse] = React.useState<boolean>(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = React.useState<boolean>(false);
  const [showLoading, setShowLoading] = React.useState<boolean>(false);
  const [skeletonLoader, setSkeletonLoader] = React.useState<boolean>(false);
  const disableDefaultShowLoadingBehaviorRef = React.useRef<boolean>(false);
  const disableDefaultSetWaitingBehaviorRef = React.useRef<boolean>(false);
  const chatService = useChatService();

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    const unsubscribeShowLoadingState = chatService.__internalService__.on(
      AutopilotChatInternalEvent.ShowLoadingState,
      (showLoadingState: boolean) => {
        setSkeletonLoader(showLoadingState);
      }
    );

    const unsubscribeShouldShowLoadingMoreMessages = chatService.__internalService__.on(
      AutopilotChatInternalEvent.ShouldShowLoadingMoreMessages,
      (value: boolean) => {
        if (!value) {
          setIsLoadingMoreMessages(false);
        }
      }
    );

    const unsubscribeSetIsLoadingMoreMessages = chatService.__internalService__.on(
      AutopilotChatInternalEvent.SetIsLoadingMoreMessages,
      (value: boolean) => {
        setIsLoadingMoreMessages(value);
      }
    );

    const unsubscribeSetShowLoading = chatService.__internalService__.on(
      AutopilotChatInternalEvent.SetShowLoading,
      (value: boolean) => {
        disableDefaultShowLoadingBehaviorRef.current = true;

        setShowLoading(value);
      }
    );

    const unsubscribeSetWaiting = chatService.__internalService__.on(
      AutopilotChatInternalEvent.SetWaiting,
      (value: boolean) => {
        disableDefaultSetWaitingBehaviorRef.current = true;

        setWaitingResponse(value);
      }
    );
    // When conversation is set, check if last message is still pending more responses
    const unsubscribeSetConversation = chatService.on(
      AutopilotChatEvent.SetConversation,
      (conversation: AutopilotChatMessage[]) => {
        const lastMessage = conversation?.[conversation.length - 1];

        if (lastMessage?.role === AutopilotChatRole.Assistant) {
          if (!disableDefaultSetWaitingBehaviorRef.current) {
            setWaitingResponse(!!lastMessage.shouldWaitForMoreMessages);
          }

          if (!disableDefaultShowLoadingBehaviorRef.current) {
            setShowLoading(false);
          }
        }
      }
    );

    const unsubscribeRequest = chatService.intercept(
      AutopilotChatInterceptableEvent.Request,
      () => {
        setWaitingResponse(true);
        setShowLoading(true);
      }
    );

    const unsubscribeResponse = chatService.on(
      AutopilotChatEvent.Response,
      (message: AutopilotChatMessage) => {
        if (!disableDefaultSetWaitingBehaviorRef.current) {
          setWaitingResponse(!!message.shouldWaitForMoreMessages);
        }

        if (!disableDefaultShowLoadingBehaviorRef.current) {
          setShowLoading(false);
        }
      }
    );

    const unsubscribeStopResponse = chatService.on(AutopilotChatEvent.StopResponse, () => {
      setWaitingResponse(false);
      setShowLoading(false);
    });

    const unsubscribeNewChat = chatService.on(AutopilotChatEvent.NewChat, () => {
      setWaitingResponse(false);
      setShowLoading(false);
    });

    return () => {
      unsubscribeShowLoadingState();
      unsubscribeRequest();
      unsubscribeResponse();
      unsubscribeStopResponse();
      unsubscribeNewChat();
      unsubscribeSetIsLoadingMoreMessages();
      unsubscribeShouldShowLoadingMoreMessages();
      unsubscribeSetShowLoading();
      unsubscribeSetWaiting();
      unsubscribeSetConversation();
    };
  }, [chatService]);

  return (
    <AutopilotLoadingContext.Provider
      value={{
        waitingResponse,
        setWaitingResponse,
        isLoadingMoreMessages,
        showLoading,
        skeletonLoader,
      }}
    >
      {children}
    </AutopilotLoadingContext.Provider>
  );
}

export function useLoading() {
  const context = React.useContext(AutopilotLoadingContext);

  if (!context) {
    throw new Error('useLoading must be used within a AutopilotLoadingProvider');
  }

  return context;
}
