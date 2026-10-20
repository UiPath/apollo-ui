import { styled } from '@mui/material';
import token from '@uipath/apollo-core';
import { useInjectedMessageRenderer } from '@uipath/apollo-react/chat/headless/hooks/use-injected-message-renderer';
import { useMessageInset } from '@uipath/apollo-react/chat/headless/hooks/use-message-inset';
import {
  type ChatBuiltInMessageRenderer,
  resolveMessageRenderer,
} from '@uipath/apollo-react/chat/headless/message-renderers';
import { useChatService } from '@uipath/apollo-react/chat/headless/providers/chat-service.provider';
import { useChatState } from '@uipath/apollo-react/chat/headless/providers/chat-state-provider';
import { useLocale } from '@uipath/apollo-react/chat/headless/providers/locale-provider';
import {
  AGENTS_TOOL_CALL_RENDERER,
  APOLLO_CHAT_TREE_RENDERER,
  type AutopilotChatMessage,
  AutopilotChatRole,
  DEFAULT_MESSAGE_RENDERER,
} from '@uipath/apollo-react/chat/service';
import { ApToolCall } from '@uipath/apollo-react/material/components/ap-tool-call';
import React from 'react';
import { Attachments } from '../common/attachments';
import { AutopilotChatMessageActions } from './actions/chat-actions';
import { AutopilotChatMarkdownRenderer } from './markdown/markdown';
import { AutopilotChatSources } from './sources/chat-sources';
import { ApolloChatTreeRenderer } from './tree/tree-renderer';

const ToolCallMessageRenderer = ({ message }: { message: AutopilotChatMessage }) => {
  const { locale } = useLocale();

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
      displayMode={message.meta.displayMode}
      locale={locale}
    />
  );
};

const ChatTreeMessageRenderer = ({ message }: { message: AutopilotChatMessage }) => {
  if (!message.meta?.span) {
    return null;
  }
  return <ApolloChatTreeRenderer span={message.meta.span} />;
};

// Must stay at module scope: `component` is used as an element type, and React reconciles those
// by reference, so rebuilding this list per render remounts the subtree and wipes ApToolCall's
// expanded state.
const MATERIAL_MESSAGE_RENDERERS: readonly ChatBuiltInMessageRenderer[] = [
  {
    name: DEFAULT_MESSAGE_RENDERER,
    component: AutopilotChatMarkdownRenderer,
  },
  {
    name: AGENTS_TOOL_CALL_RENDERER,
    component: ToolCallMessageRenderer,
  },
  {
    name: APOLLO_CHAT_TREE_RENDERER,
    component: ChatTreeMessageRenderer,
  },
];

const MessageBoxComponent = styled('div')<{
  isAssistant: boolean;
  isCustomWidget?: boolean;
}>(({ isAssistant, isCustomWidget }) => {
  const { spacing } = useChatState();
  const padding = useMessageInset();

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
    const widgetRef = React.useRef<HTMLDivElement>(null);
    useInjectedMessageRenderer(widgetRef, message);

    return (
      <MessageBox isAssistant={message.role === AutopilotChatRole.Assistant} isCustomWidget>
        {message.attachments && message.attachments.length > 0 && (
          <Attachments attachments={message.attachments} removeSpacing disableOverflow />
        )}
        <div className="chat-widget-container" ref={widgetRef} />
        {isLastInGroup && (
          <>
            {message.role === AutopilotChatRole.Assistant && (
              <AutopilotChatSources message={message} />
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

  if (!message.content && !message.contentParts && !message.attachments) {
    return null;
  }

  const renderer = resolveMessageRenderer(chatService, message, MATERIAL_MESSAGE_RENDERERS);

  if (renderer?.kind !== 'dom') {
    const MessageComponent = renderer?.component;

    return (
      <MessageBox
        isAssistant={message.role === AutopilotChatRole.Assistant}
        key={message.id}
        id={message.id}
      >
        {message.attachments && message.attachments.length > 0 && (
          <Attachments attachments={message.attachments} removeSpacing disableOverflow />
        )}
        {MessageComponent && <MessageComponent message={message} />}
        {isLastInGroup && (
          <>
            {message.role === AutopilotChatRole.Assistant && (
              <AutopilotChatSources message={message} />
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
