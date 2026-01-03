import { styled } from '@mui/material';
import token from '@uipath/apollo-core';
import React from 'react';

import type { SupportedLocale } from '../../../../../i18n';
import { ApToolCall } from '../../../ap-tool-call';
import { useChatService } from '../../providers/chat-service.provider';
import { useChatState } from '../../providers/chat-state-provider';
import { useLocale } from '../../providers/locale-provider';
import {
  AGENTS_TOOL_CALL_RENDERER,
  APOLLO_CHAT_TREE_RENDERER,
  AutopilotChatEvent,
  AutopilotChatInternalEvent,
  type AutopilotChatMessage,
  AutopilotChatMode,
  AutopilotChatRole,
  CHAT_MESSAGE_MAX_PADDING,
  CHAT_WIDTH_KEY,
  CHAT_WIDTH_SIDE_BY_SIDE_MIN,
  DEFAULT_MESSAGE_RENDERER,
  StorageService,
} from '../../service';
import { calculateDynamicPadding } from '../../utils/dynamic-padding';
import { Attachments } from '../common/attachments';
import { AutopilotChatMessageActions } from './actions/chat-actions';
import { AutopilotChatMarkdownRenderer } from './markdown/markdown';
import { AutopilotChatSources } from './sources/chat-sources';
import { ApolloChatTreeRenderer } from './tree/tree-renderer';

const getApolloMessageRenderers = (locale: SupportedLocale) => [
  {
    name: DEFAULT_MESSAGE_RENDERER,
    component: AutopilotChatMarkdownRenderer,
  },
  {
    name: AGENTS_TOOL_CALL_RENDERER,
    component: ({ message }: { message: AutopilotChatMessage }) => {
      if (!message.meta.span && !message.meta.input && !message.meta.toolName) {
        return null;
      }
      return (
        <ApToolCall
          span={message.meta.span}
          toolName={message.meta.toolName}
          input={message.meta.input}
          output={message.meta.output}
          isError={message.meta.isError}
          startTime={message.meta.startTime}
          endTime={message.meta.endTime}
          locale={locale}
        />
      );
    },
  },
  {
    name: APOLLO_CHAT_TREE_RENDERER,
    component: ({ message }: { message: AutopilotChatMessage }) => {
      if (!message.meta?.span) {
        return null;
      }
      return <ApolloChatTreeRenderer span={message.meta.span} />;
    },
  },
];

const MessageBoxComponent = styled('div')<{
  isAssistant: boolean;
  isCustomWidget?: boolean;
}>(({ isAssistant, isCustomWidget }) => {
  const chatService = useChatService();
  const { spacing } = useChatState();
  const chatInternalService = chatService.__internalService__;
  const [padding, setPadding] = React.useState(
    calculateDynamicPadding(
      parseInt(
        StorageService.Instance.get(CHAT_WIDTH_KEY) ?? CHAT_WIDTH_SIDE_BY_SIDE_MIN.toString(),
        10
      )
    )
  );

  React.useEffect(() => {
    if (!chatInternalService || !chatService) {
      return;
    }

    const unsubscribeResize = chatInternalService.on(
      AutopilotChatInternalEvent.ChatResize,
      (width: number) => {
        setPadding(calculateDynamicPadding(width));
      }
    );

    const unsubscribeMode = chatService.on(
      AutopilotChatEvent.ModeChange,
      (mode: AutopilotChatMode) => {
        if (mode === AutopilotChatMode.FullScreen) {
          setPadding(CHAT_MESSAGE_MAX_PADDING);
        } else {
          const defaultWidth = CHAT_WIDTH_SIDE_BY_SIDE_MIN.toString();
          const storedWidth = StorageService.Instance.get(CHAT_WIDTH_KEY) ?? defaultWidth;
          const width = parseInt(storedWidth, 10);

          setPadding(calculateDynamicPadding(width));
        }
      }
    );

    return () => {
      unsubscribeResize();
      unsubscribeMode();
    };
  }, [chatInternalService, chatService]);

  return {
    display: 'flex',
    padding: isAssistant ? 0 : token.Spacing.SpacingBase,
    paddingRight: isAssistant
      ? token.Spacing.SpacingXs
      : `calc(${token.Spacing.SpacingBase} + ${token.Spacing.SpacingXl})`,
    flexDirection: 'column',
    justifyContent: 'center',
    alignSelf: isAssistant ? 'flex-start' : 'flex-end',
    gap: spacing.messageGroupGap,
    borderRadius: token.Border.BorderRadiusL,
    backgroundColor: isAssistant
      ? 'unset'
      : `var(--custom-autopilot-chat-user-message-bg-color, var(--color-background-secondary))`,
    marginLeft: isAssistant ? '0' : `${padding}px`,
    marginRight: isAssistant ? token.Spacing.SpacingXl : '0',
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
    position: 'relative',
    ...(isCustomWidget && { width: '100%' }),
  };
});

const MessageBox = React.memo(MessageBoxComponent);

const WidgetContainer = React.memo(
  ({
    message,
    isLastInGroup,
    containerRef,
  }: {
    message: AutopilotChatMessage;
    isLastInGroup: boolean;
    containerRef: HTMLDivElement | null;
  }) => {
    const chatService = useChatService();
    const unsubscribeRef = React.useRef<() => void>(() => {});

    React.useEffect(() => {
      return () => {
        unsubscribeRef?.current?.();
      };
    }, []);

    return (
      <MessageBox isAssistant={message.role === AutopilotChatRole.Assistant} isCustomWidget>
        {message.attachments && message.attachments.length > 0 && (
          <Attachments attachments={message.attachments} removeSpacing disableOverflow />
        )}
        <div
          className="chat-widget-container"
          ref={(el) => {
            if (el) {
              const unsubscribe = chatService.renderMessage(el, message);

              if (unsubscribe) {
                unsubscribeRef.current = unsubscribe;
              }
            }
          }}
        />
        {isLastInGroup && (
          <>
            {message.role === AutopilotChatRole.Assistant && (
              <AutopilotChatSources groupId={message.groupId ?? ''} message={message} />
            )}
            <AutopilotChatMessageActions message={message} containerElement={containerRef} />
          </>
        )}
      </MessageBox>
    );
  }
);

function AutopilotChatMessageContentComponent({
  message,
  isLastInGroup = true,
  disableActions = false,
  containerRef,
}: {
  message: AutopilotChatMessage;
  isLastInGroup?: boolean;
  disableActions?: boolean;
  containerRef: HTMLDivElement | null;
}) {
  const chatService = useChatService();
  const { locale } = useLocale();

  if (!message.content && !message.contentParts && !message.attachments) {
    return null;
  }

  if (!chatService.getMessageRenderer(message.widget)) {
    const APOLLO_MESSAGE_RENDERERS = getApolloMessageRenderers(locale);
    const ApolloMessageRenderer = APOLLO_MESSAGE_RENDERERS.find(
      (renderer) => renderer.name === message.widget
    )?.component;

    return (
      <MessageBox
        isAssistant={message.role === AutopilotChatRole.Assistant}
        key={message.id}
        id={message.id}
      >
        {message.attachments && message.attachments.length > 0 && (
          <Attachments attachments={message.attachments} removeSpacing disableOverflow />
        )}
        {ApolloMessageRenderer ? (
          <ApolloMessageRenderer message={message} />
        ) : (
          <AutopilotChatMarkdownRenderer message={message} />
        )}
        {isLastInGroup && (
          <>
            {message.role === AutopilotChatRole.Assistant && (
              <AutopilotChatSources groupId={message.groupId ?? ''} message={message} />
            )}
            {!disableActions && (
              <AutopilotChatMessageActions message={message} containerElement={containerRef} />
            )}
          </>
        )}
      </MessageBox>
    );
  }

  return (
    <WidgetContainer
      key={message.id}
      message={message}
      isLastInGroup={isLastInGroup}
      containerRef={containerRef}
    />
  );
}

export const AutopilotChatMessageContent = React.memo(AutopilotChatMessageContentComponent);
