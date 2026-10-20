import React from 'react';

import {
  AutopilotChatEvent,
  AutopilotChatInterceptableEvent,
  AutopilotChatInternalEvent,
  type AutopilotChatMessage,
  AutopilotChatRole,
} from '../../service';
import { useChatService } from './chat-service.provider';

interface AutopilotLoadingContextType {
  waitingResponse: boolean;
  isLoadingMoreMessages: boolean;
  /** False once the host said there are no older messages (`prependOlderMessages(..., true)`). */
  hasMoreMessages: boolean;
  setWaitingResponse: (waitingResponse: boolean) => void;
  showLoading: boolean;
  skeletonLoader: boolean;
  /**
   * The messages the thinking state rotates through: the service's defaults
   * (`setDefaultLoadingMessages`), replaced by `setLoadingMessage` until the next request.
   */
  loadingMessages: string[];
  /** How long each loading message shows, in milliseconds. */
  loadingMessageDuration: number;
}

/** Placeholder the service stores for "use the localized default". */
export const DEFAULT_LOADING_MESSAGE_KEY = 'autopilot-chat-generating-response';
export const DEFAULT_LOADING_MESSAGE_DURATION = 5000;

export const AutopilotLoadingContext = React.createContext<AutopilotLoadingContextType>({
  waitingResponse: false,
  isLoadingMoreMessages: false,
  hasMoreMessages: true,
  setWaitingResponse: () => {},
  showLoading: false,
  skeletonLoader: false,
  loadingMessages: [DEFAULT_LOADING_MESSAGE_KEY],
  loadingMessageDuration: DEFAULT_LOADING_MESSAGE_DURATION,
});

export function AutopilotLoadingProvider({ children }: { children: React.ReactNode }) {
  const [waitingResponse, setWaitingResponse] = React.useState<boolean>(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = React.useState<boolean>(false);
  const [hasMoreMessages, setHasMoreMessages] = React.useState<boolean>(true);
  const [showLoading, setShowLoading] = React.useState<boolean>(false);
  const [skeletonLoader, setSkeletonLoader] = React.useState<boolean>(false);
  const disableDefaultShowLoadingBehaviorRef = React.useRef<boolean>(false);
  const disableDefaultSetWaitingBehaviorRef = React.useRef<boolean>(false);
  const chatService = useChatService();
  const defaultLoadingMessages = () =>
    chatService?.getDefaultLoadingMessages?.() ?? [DEFAULT_LOADING_MESSAGE_KEY];
  const [loadingMessages, setLoadingMessages] = React.useState<string[]>(defaultLoadingMessages);
  const [loadingMessageDuration, setLoadingMessageDuration] = React.useState<number>(
    () => chatService?.getLoadingMessageDuration?.() ?? DEFAULT_LOADING_MESSAGE_DURATION
  );

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
        setHasMoreMessages(value);
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
        // Showing again starts from the defaults, as a request does.
        if (value) {
          setLoadingMessages(
            chatService.getDefaultLoadingMessages() ?? [DEFAULT_LOADING_MESSAGE_KEY]
          );
        }
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
        // Each turn starts from the defaults, as Material's loading text did when it mounted.
        setLoadingMessages(
          chatService.getDefaultLoadingMessages() ?? [DEFAULT_LOADING_MESSAGE_KEY]
        );
      }
    );

    const unsubscribeDefaultLoadingMessages = chatService.on(
      AutopilotChatEvent.SetDefaultLoadingMessages,
      (data: { messages: string[]; duration?: number }) => {
        setLoadingMessages(data.messages);
        // The service keeps an earlier duration when none is given; so does this.
        setLoadingMessageDuration(
          chatService.getLoadingMessageDuration() ?? DEFAULT_LOADING_MESSAGE_DURATION
        );
      }
    );

    const unsubscribeLoadingMessage = chatService.on(
      AutopilotChatEvent.SetLoadingMessage,
      (message: string) => setLoadingMessages([message])
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
      unsubscribeDefaultLoadingMessages();
      unsubscribeLoadingMessage();
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
        hasMoreMessages,
        showLoading,
        skeletonLoader,
        loadingMessages,
        loadingMessageDuration,
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
