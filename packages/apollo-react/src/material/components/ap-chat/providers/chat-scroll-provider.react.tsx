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

    const [ overflowContainer, setOverflowContainer ] = React.useState<HTMLDivElement | null>(null);
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

        if (overflowContainer) {
            overflowContainer.scrollTo({
                top: overflowContainer.scrollHeight,
                behavior,
            });
        }
    }, [ autoScroll, overflowContainer ]);

    const handleResize = React.useCallback(() => {
        if (!autoScroll || !contentRef.current || !overflowContainer) {
            return;
        }

        const newHeight = contentRef.current.scrollHeight;

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

        const unsubscribeToggleAutoScroll = chatService.__internalService__
            .on(AutopilotChatInternalEvent.ToggleAutoScroll, (autoScroll: boolean) => {
                setAutoScroll(autoScroll);
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
            unsubscribeToggleAutoScroll();
        };
    }, [ handleResize, handleWheel, handleKeyDown, handleMouseUp, handleMouseDown, chatService, overflowContainer ]);

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
