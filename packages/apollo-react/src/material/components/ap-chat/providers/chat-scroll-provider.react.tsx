/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import token from '@uipath/apollo-core/lib';
import { AutopilotChatInternalEvent } from '@uipath/portal-shell-util';
import React from 'react';

import { AutopilotChatInternalService } from '../services/chat-internal-service';
import { CHAT_SCROLL_DELAY } from '../utils/constants';

interface ChatScrollContextType {
    autoScroll: boolean;
    setAutoScroll: (autoScroll: boolean) => void;
    scrollToBottom: (options?: { force?: boolean; behavior?: ScrollBehavior }) => () => void;
    overflowContainerRef: React.RefObject<HTMLDivElement>;
}

const ChatScrollContext = React.createContext<ChatScrollContextType | null>(null);

interface ChatScrollProviderProps {
    children: React.ReactNode;
}

export const ChatScrollProvider: React.FC<ChatScrollProviderProps> = ({ children }) => {
    const overflowContainerRef = React.useRef<HTMLDivElement>(null);
    const [ autoScroll, setAutoScroll ] = React.useState(true);
    const autoScrollRef = React.useRef(autoScroll);
    const distanceToBottomRef = React.useRef(0);
    const lastScrollTop = React.useRef(0);
    const isScrollingUpRef = React.useRef(false);
    const chatInternalService = AutopilotChatInternalService.Instance;
    const scrollToBottomDelayRef = React.useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        autoScrollRef.current = autoScroll;
    }, [ autoScroll ]);

    const scrollToBottom = React.useCallback(({
        force = false,
        behavior = 'smooth',
    }: { force?: boolean; behavior?: ScrollBehavior } = {}) => {
        scrollToBottomDelayRef.current = setTimeout(() => {
            animationFrameRef.current = requestAnimationFrame(() => {
                if (!force && (!autoScrollRef.current || isScrollingUpRef.current)) {
                    return;
                }

                const container = overflowContainerRef.current;

                if (container) {
                    container.scrollTo({
                        top: container.scrollHeight,
                        behavior,
                    });
                }
            });
        }, CHAT_SCROLL_DELAY);

        return () => {
            if (scrollToBottomDelayRef.current) {
                clearTimeout(scrollToBottomDelayRef.current);
            }

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    const handleScroll = React.useCallback(() => {
        const container = overflowContainerRef.current;

        if (!container) {
            return;
        }

        if (scrollToBottomDelayRef.current) {
            clearTimeout(scrollToBottomDelayRef.current);
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        const isScrollingUp = container.scrollTop < lastScrollTop.current;
        distanceToBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight;

        if (isScrollingUp && isScrollingUp !== isScrollingUpRef.current) {
            setAutoScroll(false);
        }

        if (!isScrollingUp && distanceToBottomRef.current < parseInt(token.Spacing.SpacingL, 10)) {
            setAutoScroll(true);
            scrollToBottom({ force: true });
        }

        isScrollingUpRef.current = isScrollingUp;
        lastScrollTop.current = container.scrollTop;
    }, [ setAutoScroll, scrollToBottom ]);

    React.useEffect(() => {
        const container = overflowContainerRef.current;

        if (!container) {
            return;
        }

        container.addEventListener('scroll', handleScroll);

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [ handleScroll ]);

    React.useEffect(() => {
        if (!chatInternalService) {
            return;
        }

        const unsubscribe = chatInternalService.on(AutopilotChatInternalEvent.ScrollToBottom, (options?: {
            force?: boolean;
            behavior?: ScrollBehavior;
        }) => {
            scrollToBottom(options);
        });

        return () => unsubscribe();
    }, [ scrollToBottom, chatInternalService ]);

    const value = React.useMemo(() => ({
        autoScroll,
        setAutoScroll,
        scrollToBottom,
        overflowContainerRef,
    }), [ autoScroll, setAutoScroll, scrollToBottom ]);

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
