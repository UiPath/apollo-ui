/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    AutopilotChatEvent,
    AutopilotChatInterceptableEvent,
} from '@uipath/portal-shell-util';
import React from 'react';

import { AutopilotChatService } from '../services/chat-service';
import { CHAT_SCROLL_BOTTOM_BUFFER } from '../utils/constants';
import { useStreaming } from './streaming-provider.react';

interface ChatScrollContextType {
    autoScroll: boolean;
    scrollToBottom: (options?: { force?: boolean; behavior?: ScrollBehavior }) => void;
    overflowContainerRef: React.RefObject<HTMLDivElement>;
    contentRef: React.RefObject<HTMLDivElement>;
}

const ChatScrollContext = React.createContext<ChatScrollContextType | null>(null);

interface ChatScrollProviderProps {
    children: React.ReactNode;
}

export const ChatScrollProvider: React.FC<ChatScrollProviderProps> = ({ children }) => {
    const chatService = AutopilotChatService.Instance;

    const overflowContainerRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const previousHeightRef = React.useRef<number>(0);
    const isDraggingScrollBarRef = React.useRef(false);
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
                behavior: isNearBottom || streaming ? 'instant' : 'smooth',
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
        });

        const unsubscribeNewChat = chatService.on(AutopilotChatEvent.NewChat, () => {
            setAutoScroll(true);
        });

        return () => {
            resizeObserver.disconnect();
            overflowContainer.removeEventListener('wheel', handleWheel);
            overflowContainer.removeEventListener('mousedown', handleMouseDown);
            overflowContainer.removeEventListener('mouseup', handleMouseUp);
            overflowContainer.removeEventListener('keydown', handleKeyDown);
            unsubscribeRequestIntercept();
            unsubscribeNewChat();
        };
    }, [ handleResize, handleWheel, handleKeyDown, handleMouseUp, handleMouseDown, chatService ]);

    const value = React.useMemo(() => ({
        autoScroll,
        scrollToBottom,
        overflowContainerRef,
        contentRef,
    }), [ autoScroll, scrollToBottom, overflowContainerRef, contentRef ]);

    return (
        <ChatScrollContext.Provider value={value}>
            {children}
        </ChatScrollContext.Provider>
    );
};

export const useChatScroll = () => {
    const context = React.useContext(ChatScrollContext);

    if (!context) {
        throw new Error('useChatScroll must be used within a ChatScrollProvider');
    }

    return context;
};
