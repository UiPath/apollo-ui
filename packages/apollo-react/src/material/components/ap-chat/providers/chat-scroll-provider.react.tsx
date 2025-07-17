/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    AutopilotChatEvent,
    AutopilotChatInterceptableEvent,
    AutopilotChatInternalEvent,
    CHAT_SCROLL_BOTTOM_BUFFER,
} from '@uipath/portal-shell-util';
import React from 'react';

import { useChatService } from './chat-service.provider.react';
import { useStreaming } from './streaming-provider.react';

interface AutopilotChatScrollContextType {
    autoScroll: boolean;
    scrollToBottom: (options?: { force?: boolean; behavior?: ScrollBehavior }) => void;
    overflowContainer: HTMLDivElement | null;
    setOverflowContainer: (overflowContainer: HTMLDivElement) => void;
    contentRef: React.RefObject<HTMLDivElement>;
}

const AutopilotChatScrollContext = React.createContext<AutopilotChatScrollContextType | null>(null);

interface AutopilotChatScrollProviderProps {
    children: React.ReactNode;
}

export const AutopilotChatScrollProvider: React.FC<AutopilotChatScrollProviderProps> = ({ children }) => {
    const chatService = useChatService();
    const { streaming } = useStreaming();

    const contentRef = React.useRef<HTMLDivElement>(null);
    const previousHeightRef = React.useRef<number>(0);
    const isDraggingScrollBarRef = React.useRef(false);
    const useInstantScrollRef = React.useRef(true);
    const isLoadingMoreMessagesRef = React.useRef(false);
    const shouldShowLoadingMoreMessagesRef = React.useRef(true);
    const prependingRef = React.useRef(false);
    const scrollTopBeforePrependRef = React.useRef(0);
    const scrollHeightBeforePrependRef = React.useRef(0);

    const [ overflowContainer, setOverflowContainer ] = React.useState<HTMLDivElement | null>(null);
    const [ autoScroll, setAutoScroll ] = React.useState(true);

    const scrollToBottom = React.useCallback(({
        force = false,
        behavior = 'smooth',
    }: { force?: boolean; behavior?: ScrollBehavior } = {}) => {
        if (!force && !autoScroll) {
            return;
        }

        if (!autoScroll && force) {
            setAutoScroll(true);
        }

        if (overflowContainer) {
            overflowContainer.scrollTo({
                top: overflowContainer.scrollHeight,
                behavior: streaming ? 'instant' : behavior,
            });
        }
    }, [ autoScroll, overflowContainer, streaming ]);

    const handleResize = React.useCallback(() => {
        if (!contentRef.current || !overflowContainer) {
            return;
        }

        const newHeight = contentRef.current.scrollHeight;

        // Handle prepending older messages: maintain scroll position
        if (prependingRef.current) {
            const heightDifference = newHeight - scrollHeightBeforePrependRef.current;
            const newScrollTop = scrollTopBeforePrependRef.current + heightDifference;

            overflowContainer.scrollTo({
                top: newScrollTop,
                behavior: 'instant',
            });

            prependingRef.current = false;
            previousHeightRef.current = newHeight;
            return;
        }

        // Handle normal case: auto-scroll to bottom if needed
        if (!autoScroll) {
            previousHeightRef.current = newHeight;
            return;
        }

        // if the chat is in auto-scroll mode, scroll to the bottom if the content is taller than the previous height
        if (newHeight > previousHeightRef.current && autoScroll) {
            const distance = overflowContainer.scrollHeight - overflowContainer.scrollTop - overflowContainer.clientHeight;
            const isNearBottom = distance < CHAT_SCROLL_BOTTOM_BUFFER;

            scrollToBottom({
                force: true,
                behavior: isNearBottom || streaming || useInstantScrollRef.current ? 'instant' : 'smooth',
            });
        }

        previousHeightRef.current = newHeight;
    }, [ contentRef, autoScroll, scrollToBottom, streaming, overflowContainer ]);

    // When scrolling up, we want to disable auto-scroll
    const handleWheel = React.useCallback((event: WheelEvent) => {
        if (!overflowContainer) {
            return;
        }

        if (event.deltaY < 0 && overflowContainer.scrollHeight > overflowContainer.clientHeight) {
            setAutoScroll(false);
        } else if (
            event.deltaY > 0 &&
            overflowContainer.scrollHeight - overflowContainer.scrollTop - overflowContainer.clientHeight < CHAT_SCROLL_BOTTOM_BUFFER
        ) {
            setAutoScroll(true);
        }
    }, [ setAutoScroll, overflowContainer ]);

    const handleScroll = React.useCallback(() => {
        if (!overflowContainer) {
            return;
        }

        // Check if user is at the top of the container and is not already loading more messages
        if (overflowContainer.scrollTop === 0 &&
            !isLoadingMoreMessagesRef.current &&
             shouldShowLoadingMoreMessagesRef.current &&
             chatService?.getConfig()?.paginatedMessages
        ) {
            (chatService as any)._eventBus.publish(AutopilotChatEvent.ConversationLoadMore);
            chatService.__internalService__.publish(AutopilotChatInternalEvent.SetIsLoadingMoreMessages, true);
        }
    }, [ overflowContainer, chatService, isLoadingMoreMessagesRef ]);

    const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
        if (!overflowContainer) {
            return;
        }

        if (event.key === 'ArrowUp') {
            setAutoScroll(false);
        }

        if (event.key === 'ArrowDown') {
            const distance = overflowContainer.scrollHeight - overflowContainer.scrollTop - overflowContainer.clientHeight;

            // if we're near the bottom, enable auto-scroll
            if (distance < CHAT_SCROLL_BOTTOM_BUFFER) {
                setAutoScroll(true);
            }
        }
    }, [ overflowContainer ]);

    const handleMouseDown = React.useCallback((event: MouseEvent) => {
        if (!overflowContainer) {
            return;
        }

        // Focus when clicking on it so that the keyboard events are captured for the container
        overflowContainer.focus();

        const scrollbarWidth = overflowContainer.offsetWidth - overflowContainer.clientWidth;
        const scrollbarXStart = overflowContainer.getBoundingClientRect().right - scrollbarWidth;

        // Check if mouse is within the vertical scrollbar zone and prevent auto-scroll
        if (event.clientX >= scrollbarXStart) {
            isDraggingScrollBarRef.current = true;
            setAutoScroll(false);
        }
    }, [ overflowContainer ]);

    const handleMouseUp = React.useCallback(() => {
        if (isDraggingScrollBarRef.current) {
            isDraggingScrollBarRef.current = false;

            if (overflowContainer) {
                const distance = overflowContainer.scrollHeight - overflowContainer.scrollTop - overflowContainer.clientHeight;

                // if we're near the bottom after releasing the scrollbar, enable auto-scroll
                if (distance < CHAT_SCROLL_BOTTOM_BUFFER) {
                    setAutoScroll(true);
                }
            }
        }
    }, [ overflowContainer ]);

    React.useEffect(() => {
        const content = contentRef.current;

        if (!content || !overflowContainer || !chatService) {
            return;
        }

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(content);

        overflowContainer.addEventListener('mousedown', handleMouseDown);
        overflowContainer.addEventListener('mouseup', handleMouseUp);
        overflowContainer.addEventListener('keydown', handleKeyDown);
        overflowContainer.addEventListener('wheel', handleWheel, { passive: true });
        overflowContainer.addEventListener('scroll', handleScroll, { passive: true });

        const unsubscribeRequestIntercept = chatService.intercept(AutopilotChatInterceptableEvent.Request, () => {
            setAutoScroll(true);
            useInstantScrollRef.current = false;
        });

        const unsubscribeNewChat = chatService.on(AutopilotChatEvent.NewChat, () => {
            setAutoScroll(true);
            useInstantScrollRef.current = false;
        });

        const unsubscribeOpenConversation = chatService.on(AutopilotChatEvent.OpenConversation, () => {
            setAutoScroll(true);
        });

        const unsubscribeSetConversation = chatService.on(AutopilotChatEvent.SetConversation, () => {
            useInstantScrollRef.current = true;
        });

        const unsubscribeModeChange = chatService.on(AutopilotChatEvent.ModeChange, () => {
            useInstantScrollRef.current = true;
        });

        const unsubscribeToggleAutoScroll = chatService.__internalService__.on(
            AutopilotChatInternalEvent.ToggleAutoScroll,
            (autoScrollValue: boolean) => {
                setAutoScroll(autoScrollValue);
            },
        );

        const unsubscribeSetIsLoadingMoreMessages = chatService.__internalService__.on(
            AutopilotChatInternalEvent.SetIsLoadingMoreMessages,
            (value: boolean) => {
                isLoadingMoreMessagesRef.current = value;
            },
        );

        const unsubscribeShouldShowLoadingMoreMessages = chatService.__internalService__.on(
            AutopilotChatInternalEvent.ShouldShowLoadingMoreMessages,
            (value: boolean) => {
                shouldShowLoadingMoreMessagesRef.current = value;
            },
        );

        const unsubscribePrependOlderMessages = chatService.__internalService__.on(
            AutopilotChatInternalEvent.PrependOlderMessages,
            () => {
                if (overflowContainer && contentRef.current) {
                    prependingRef.current = true;
                    scrollTopBeforePrependRef.current = overflowContainer.scrollTop;
                    scrollHeightBeforePrependRef.current = contentRef.current.scrollHeight;
                }
            },
        );

        return () => {
            resizeObserver.disconnect();
            overflowContainer.removeEventListener('wheel', handleWheel);
            overflowContainer.removeEventListener('mousedown', handleMouseDown);
            overflowContainer.removeEventListener('mouseup', handleMouseUp);
            overflowContainer.removeEventListener('keydown', handleKeyDown);
            overflowContainer.removeEventListener('scroll', handleScroll);

            unsubscribeRequestIntercept();
            unsubscribeNewChat();
            unsubscribeOpenConversation();
            unsubscribeSetConversation();
            unsubscribeModeChange();
            unsubscribeToggleAutoScroll();
            unsubscribeSetIsLoadingMoreMessages();
            unsubscribeShouldShowLoadingMoreMessages();
            unsubscribePrependOlderMessages();
        };
    }, [ handleResize, handleWheel, handleKeyDown, handleMouseUp, handleMouseDown, handleScroll, chatService, overflowContainer ]);

    const value = React.useMemo(() => ({
        autoScroll,
        scrollToBottom,
        overflowContainer,
        setOverflowContainer,
        contentRef,
    }), [ autoScroll, scrollToBottom, overflowContainer, setOverflowContainer, contentRef ]);

    return (
        <AutopilotChatScrollContext.Provider value={value}>
            {children}
        </AutopilotChatScrollContext.Provider>
    );
};

export const useChatScroll = () => {
    const context = React.useContext(AutopilotChatScrollContext);

    if (!context) {
        throw new Error('useChatScroll must be used within a AutopilotChatScrollProvider');
    }

    return context;
};
