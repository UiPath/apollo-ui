/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    AutopilotChatEvent,
    AutopilotChatInterceptableEvent,
    CHAT_SCROLL_BOTTOM_BUFFER,
} from '@uipath/portal-shell-util';
import React from 'react';

import { useChatService } from './chat-service.provider.react';
import { useStreaming } from './streaming-provider.react';

interface AutopilotChatScrollContextType {
    autoScroll: boolean;
    scrollToBottom: (options?: { force?: boolean; behavior?: ScrollBehavior }) => void;
    overflowContainerRef: React.RefObject<HTMLDivElement>;
    contentRef: React.RefObject<HTMLDivElement>;
}

const AutopilotChatScrollContext = React.createContext<AutopilotChatScrollContextType | null>(null);

interface AutopilotChatScrollProviderProps {
    children: React.ReactNode;
}

export const AutopilotChatScrollProvider: React.FC<AutopilotChatScrollProviderProps> = ({ children }) => {
    const chatService = useChatService();

    const overflowContainerRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const previousHeightRef = React.useRef<number>(0);
    const isDraggingScrollBarRef = React.useRef(false);
    const useInstantScrollRef = React.useRef(true);
    const { streaming } = useStreaming();

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

        const container = overflowContainerRef.current;

        if (container) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior,
            });
        }
    }, [ autoScroll ]);

    const handleResize = React.useCallback(() => {
        if (!autoScroll || !contentRef.current || !overflowContainerRef.current) {
            return;
        }

        const newHeight = contentRef.current.scrollHeight;

        // if the chat is in auto-scroll mode, scroll to the bottom if the content is taller than the previous height
        if (newHeight > previousHeightRef.current && autoScroll) {
            const container = overflowContainerRef.current;
            const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
            const isNearBottom = distance < CHAT_SCROLL_BOTTOM_BUFFER;

            scrollToBottom({
                force: true,
                behavior: isNearBottom || streaming || useInstantScrollRef.current ? 'instant' : 'smooth',
            });
        }

        previousHeightRef.current = newHeight;
    }, [ contentRef, autoScroll, scrollToBottom, streaming ]);

    // When scrolling up, we want to disable auto-scroll
    const handleWheel = React.useCallback((event: WheelEvent) => {
        const container = overflowContainerRef.current;

        if (!container) {
            return;
        }

        if (event.deltaY < 0 && container.scrollHeight > container.clientHeight) {
            setAutoScroll(false);
        } else if (event.deltaY > 0 && container.scrollHeight - container.scrollTop - container.clientHeight < CHAT_SCROLL_BOTTOM_BUFFER) {
            setAutoScroll(true);
        }
    }, [ setAutoScroll ]);

    const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
        const container = overflowContainerRef.current;
        if (!container) {
            return;
        }

        if (event.key === 'ArrowUp') {
            setAutoScroll(false);
        }

        if (event.key === 'ArrowDown') {
            const distance = container.scrollHeight - container.scrollTop - container.clientHeight;

            // if we're near the bottom, enable auto-scroll
            if (distance < CHAT_SCROLL_BOTTOM_BUFFER) {
                setAutoScroll(true);
            }
        }
    }, []);

    const handleMouseDown = React.useCallback((event: MouseEvent) => {
        const container = overflowContainerRef.current;
        if (!container) {
            return;
        }

        // Focus when clicking on it so that the keyboard events are captured for the container
        container.focus();

        const scrollbarWidth = container.offsetWidth - container.clientWidth;
        const scrollbarXStart = container.getBoundingClientRect().right - scrollbarWidth;

        // Check if mouse is within the vertical scrollbar zone and prevent auto-scroll
        if (event.clientX >= scrollbarXStart) {
            isDraggingScrollBarRef.current = true;
            setAutoScroll(false);
        }
    }, []);

    const handleMouseUp = React.useCallback(() => {
        if (isDraggingScrollBarRef.current) {
            isDraggingScrollBarRef.current = false;

            const container = overflowContainerRef.current;

            if (container) {
                const distance = container.scrollHeight - container.scrollTop - container.clientHeight;

                // if we're near the bottom after releasing the scrollbar, enable auto-scroll
                if (distance < CHAT_SCROLL_BOTTOM_BUFFER) {
                    setAutoScroll(true);
                }
            }
        }
    }, []);

    React.useEffect(() => {
        const content = contentRef.current;
        const overflowContainer = overflowContainerRef.current;

        if (!content || !overflowContainer || !chatService) {
            return;
        }

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(content);

        overflowContainer.addEventListener('wheel', handleWheel);
        overflowContainer.addEventListener('mousedown', handleMouseDown);
        overflowContainer.addEventListener('mouseup', handleMouseUp);
        overflowContainer.addEventListener('keydown', handleKeyDown);

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

        return () => {
            resizeObserver.disconnect();
            overflowContainer.removeEventListener('wheel', handleWheel);
            overflowContainer.removeEventListener('mousedown', handleMouseDown);
            overflowContainer.removeEventListener('mouseup', handleMouseUp);
            overflowContainer.removeEventListener('keydown', handleKeyDown);

            unsubscribeRequestIntercept();
            unsubscribeNewChat();
            unsubscribeOpenConversation();
            unsubscribeSetConversation();
            unsubscribeModeChange();
        };
    }, [ handleResize, handleWheel, handleKeyDown, handleMouseUp, handleMouseDown, chatService ]);

    const value = React.useMemo(() => ({
        autoScroll,
        scrollToBottom,
        overflowContainerRef,
        contentRef,
    }), [ autoScroll, scrollToBottom, overflowContainerRef, contentRef ]);

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
