/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    Theme,
} from '@mui/material/styles';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatEvent,
    AutopilotChatMode,
} from '@uipath/portal-shell-util';
import React from 'react';

import { DragHandle } from './components/common/drag-handle.react';
import { AutopilotChatDropzone } from './components/dropzone/dropzone.react';
import { AutopilotChatHeader } from './components/header/header.react';
import { AutopilotChatInput } from './components/input/chat-input.react';
import { AutopilotChatMessages } from './components/message/chat-message.react';
import { AutopilotChatScrollToBottomButton } from './components/message/chat-scroll-to-bottom.react';
import { AutopilotAttachmentsProvider } from './providers/attachements-provider.react';
import {
    ChatWidthProvider,
    useChatWidth,
} from './providers/chat-width-provider.react';
import { AutopilotErrorProvider } from './providers/error-provider.react';
import { AutopilotLoadingProvider } from './providers/loading-provider.react';
import { AutopilotStreamingProvider } from './providers/streaming-provider.react';
import { AutopilotChatService } from './services/chat-service';
import {
    CHAT_WIDTH_FULL_SCREEN,
    CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
} from './utils/constants';

const ChatContainer = styled('div')<{ shouldAnimate: boolean; mode: AutopilotChatMode; width: number }>(({
    shouldAnimate, mode, width, theme,
}: { shouldAnimate: boolean; mode: AutopilotChatMode; width: number; theme: Theme }) => ({
    width: mode === AutopilotChatMode.FullScreen ? CHAT_WIDTH_FULL_SCREEN : width,
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 48px)', // account for global header hight
    position: 'relative',
    boxSizing: 'border-box',
    border: `${token.Border.BorderThickS} solid ${theme.palette.semantic.colorBorderDeEmp}`,
    borderTop: 'none',
    borderLeft: 'none',
    ...(shouldAnimate && { transition: 'width 0.2s ease' }),
    ...(mode === AutopilotChatMode.Closed && { display: 'none' }),
}));

const HeaderContainer = styled('div')(() => ({
    flexShrink: 0,
    paddingBottom: token.Spacing.SpacingBase,
    padding: `${token.Spacing.SpacingBase} ${token.Spacing.SpacingL}`,
}));

const OverflowContainer = styled('div')(() => ({
    flex: '1 1 100%',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    marginBottom: token.Spacing.SpacingBase,
    position: 'relative',
}));

const MessagesContainer = styled('div')(({ isFullScreen }: { isFullScreen: boolean }) => ({
    ...(isFullScreen && {
        maxWidth: CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
        margin: '0 auto',
        width: '100%',
    }),
    height: '100%',
}));

const InputBackground = styled('div')(({ theme }) => ({
    flexShrink: 0,
    borderTop: `${token.Border.BorderThickS} solid ${theme.palette.semantic.colorBorderDeEmp}`,
    padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingL}`,
    backgroundColor: theme.palette.semantic.colorBackgroundSecondary,
}));

const InputContainer = styled('div')<{ isFullScreen: boolean }>(({ isFullScreen }: { isFullScreen: boolean }) => ({
    ...(isFullScreen && {
        maxWidth: CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
        margin: '0 auto',
        width: '100%',
    }),
}));

function AutopilotChatContent() {
    const overflowContainerRef = React.useRef<HTMLDivElement>(null);
    const [ mode, setMode ] = React.useState<AutopilotChatMode>(
        AutopilotChatService.Instance?.getConfig?.()?.mode ?? AutopilotChatMode.SideBySide,
    );
    const [ autoScroll, setAutoScroll ] = React.useState(true);
    const chatService = AutopilotChatService.Instance;
    const {
        width, shouldAnimate,
    } = useChatWidth();
    const widthRef = React.useRef(width);
    // keep track of the distance to the bottom of the container while scrolling to decide between instant and smooth scroll
    const distanceToBottomRef = React.useRef(0);
    // Check if the user is scrolling up to cancel the auto scroll
    const lastScrollTop = React.useRef(0);
    const isScrollingUpRef = React.useRef(false);

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribe = chatService.on(AutopilotChatEvent.ModeChange, (chatMode) => {
            setMode(chatMode);
        });

        return () => {
            unsubscribe();
        };
    }, [ chatService ]);

    const setDistanceToBottom = React.useCallback(() => {
        const container = overflowContainerRef.current;

        if (!container) {
            return;
        }

        distanceToBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight;
    }, []);

    const handleScroll = React.useCallback(() => {
        requestAnimationFrame(() => {
            const container = overflowContainerRef.current;

            if (!container) {
                return;
            }

            const isScrollingUp = container.scrollTop < lastScrollTop.current;
            setDistanceToBottom();

            if (isScrollingUp !== isScrollingUpRef.current) {
                if (isScrollingUp) {
                    setAutoScroll(false);
                }
            }

            if (!isScrollingUp && distanceToBottomRef.current < parseInt(token.Spacing.SpacingL, 10)) {
                setAutoScroll(true);
            }

            isScrollingUpRef.current = isScrollingUp;
            lastScrollTop.current = container.scrollTop;
        });
    }, [ setDistanceToBottom ]);

    const scrollToBottom = React.useCallback(({
        force = false, behavior = 'smooth',
    }: { force?: boolean; behavior?: ScrollBehavior } = {}) => {
        // need a delay for the content to be rendered
        const timeout = setTimeout(() => {
            requestAnimationFrame(() => {
                if (!force && (!autoScroll || isScrollingUpRef.current)) {
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
        }, 200);

        return () => {
            clearTimeout(timeout);
        };
    }, [ autoScroll ]);

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

    // if the width changes, we need to check if we need to scroll to the bottom
    React.useEffect(() => {
        if (widthRef.current === width) {
            return;
        }

        widthRef.current = width;

        const frame = requestAnimationFrame(() => {
            setDistanceToBottom();

            if (distanceToBottomRef.current < parseInt(token.Spacing.SpacingL, 10)) {
                scrollToBottom({
                    force: true,
                    behavior: 'instant',
                });
                setAutoScroll(true);
            }
        });

        return () => {
            cancelAnimationFrame(frame);
        };
    }, [ width, scrollToBottom, setDistanceToBottom ]);

    return (
        <ChatContainer
            shouldAnimate={shouldAnimate}
            mode={mode}
            width={width}
        >
            <DragHandle />

            <HeaderContainer>
                <AutopilotChatHeader />
            </HeaderContainer>

            <OverflowContainer id="overflow-container" ref={overflowContainerRef}>
                <MessagesContainer isFullScreen={mode === AutopilotChatMode.FullScreen}>
                    <AutopilotChatMessages
                        overflowContainerRef={overflowContainerRef}
                        scrollToBottom={scrollToBottom}
                    />
                </MessagesContainer>
            </OverflowContainer>

            <AutopilotChatScrollToBottomButton
                visible={!autoScroll}
                onClick={() => {
                    scrollToBottom({ force: true });
                    setAutoScroll(true);
                }}
                containerRef={overflowContainerRef}
            />

            <InputBackground>
                <InputContainer isFullScreen={mode === AutopilotChatMode.FullScreen}>
                    <AutopilotChatInput />
                </InputContainer>
            </InputBackground>
        </ChatContainer>
    );
}

export function ApAutopilotChatReact() {
    return (
        <AutopilotErrorProvider>
            <AutopilotLoadingProvider>
                <AutopilotStreamingProvider>
                    <AutopilotAttachmentsProvider>
                        <ChatWidthProvider>
                            <AutopilotChatDropzone>
                                <AutopilotChatContent />
                            </AutopilotChatDropzone>
                        </ChatWidthProvider>
                    </AutopilotAttachmentsProvider>
                </AutopilotStreamingProvider>
            </AutopilotLoadingProvider>
        </AutopilotErrorProvider>
    );
}
