import { styled } from '@mui/material';
import token from '@uipath/apollo-core';
import React from 'react';

import { useChatScroll } from '../../providers/chat-scroll-provider';
import { useChatState } from '../../providers/chat-state-provider';
import {
  type AutopilotChatConfiguration,
  AutopilotChatMode,
  CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
} from '../../service';
import { AutopilotChatMessages } from './chat-message';
import { AutopilotChatScrollToBottomButton } from './chat-scroll-to-bottom';

type OverflowContainerProps = {
  isOverflow: boolean;
  isContainerWide: boolean;
  scrollBarTheming?: NonNullable<AutopilotChatConfiguration['theming']>['scrollBar'];
};

const OverflowContainer = styled('div')<OverflowContainerProps>(
  ({ isOverflow, isContainerWide, scrollBarTheming }) => {
    const baseStyles = {
      flex: '1 1 100%',
      minHeight: 0,
      overflowY: 'auto' as const,
      overflowX: 'hidden' as const,
      position: 'relative' as const,
      outline: 'none',
      // move the scrollbar to the right
      margin: `0 -${token.Spacing.SpacingL}`,
      padding: `0 ${token.Spacing.SpacingL}`,

      ...(isOverflow &&
        !isContainerWide && {
          // account for the scrollbar
          paddingRight: token.Spacing.SpacingXs,
        }),
    };

    const scrollBarStyles: Record<string, any> = {};

    if (scrollBarTheming?.scrollSize) {
      scrollBarStyles['&::-webkit-scrollbar'] = {
        width: scrollBarTheming.scrollSize,
        height: scrollBarTheming.scrollSize,
      };
    }

    if (scrollBarTheming?.scrollThumbColor) {
      scrollBarStyles['&::-webkit-scrollbar-thumb'] = {
        backgroundColor: scrollBarTheming.scrollThumbColor,
      };
    }

    if (scrollBarTheming?.scrollHoverColor) {
      scrollBarStyles['&::-webkit-scrollbar-thumb']['&:hover'] = {
        backgroundColor: scrollBarTheming.scrollHoverColor,
      };
    }

    if (scrollBarTheming?.scrollBorderRadius) {
      scrollBarStyles['&::-webkit-scrollbar-thumb']['borderRadius'] =
        scrollBarTheming.scrollBorderRadius;
    }

    return {
      ...baseStyles,
      ...scrollBarStyles,
    };
  }
);

const MessagesContainer = styled('div')(
  ({ mode, paddingTop }: { mode: AutopilotChatMode; paddingTop?: string }) => ({
    ...(paddingTop && { paddingTop }),
    ...((mode === AutopilotChatMode.FullScreen || mode === AutopilotChatMode.Embedded) && {
      maxWidth: CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
      margin: '0 auto',
      width: '100%',
    }),
  })
);

const StyledGradientContainer = styled('div')(() => ({
  position: 'sticky',
  zIndex: 1,
  bottom: 0,
  left: token.Spacing.SpacingBase,
  width: '100%',
  height: token.Spacing.SpacingBase,
  background: `linear-gradient(
        to bottom,
            var(--color-background)25 0%,
            var(--color-background)50 25%,
            var(--color-background) 50%
        )`,
}));

const GradientContainer = React.memo(() => {
  const { hasMessages } = useChatState();

  if (!hasMessages) {
    return null;
  }

  return <StyledGradientContainer />;
});

interface ChatScrollContainerProps {
  mode: AutopilotChatMode;
}

function ChatScrollContainerComponent({ mode }: ChatScrollContainerProps) {
  const { setOverflowContainer, contentRef, overflowContainer, isOverflow, isContainerWide } =
    useChatScroll();
  const { disabledFeatures, theming } = useChatState();

  return (
    <>
      <OverflowContainer
        tabIndex={0}
        id="overflow-container"
        isOverflow={isOverflow}
        scrollBarTheming={theming?.scrollBar}
        isContainerWide={isContainerWide}
        ref={setOverflowContainer}
      >
        <MessagesContainer
          id="content-ref"
          ref={contentRef}
          mode={mode}
          paddingTop={disabledFeatures.headerSeparator ? undefined : token.Spacing.SpacingXs}
        >
          <AutopilotChatMessages isOverflow={isOverflow} isContainerWide={isContainerWide} />
        </MessagesContainer>

        <GradientContainer />
      </OverflowContainer>

      <AutopilotChatScrollToBottomButton overflowContainer={overflowContainer} />
    </>
  );
}

export const ChatScrollContainer = React.memo(ChatScrollContainerComponent);
