// Import Katex CSS
import 'katex/dist/katex.min.css';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { styled } from '@mui/material';
import token from '@uipath/apollo-core';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { useIsStreamingMessage } from '../../../hooks/use-is-streaming-message';
import { useChatService } from '../../../providers/chat-service.provider';
import { useChatState } from '../../../providers/chat-state-provider';
import { useStreaming } from '../../../providers/streaming-provider';
import { AutopilotChatEvent, type AutopilotChatMessage } from '../../../service';
import { Citation } from './citation';
import { Code } from './code';
import { Li, Ol, Ul } from './lists';
import { citationPlugin, contentPartsToMarkdown } from './parsers/citation-parser';
import { resourceTokenPlugin } from './parsers/resource-token-parser';
import { ResourceChip } from './resource-chip';
import { Cell, HeaderCell, Row, Table, TableHeader } from './table';
import {
  Blockquote,
  Break,
  Del,
  Emphazised,
  getTextForVariant,
  Hr,
  Link,
  Pre,
  Strong,
} from './text';

const MarkdownContainer = styled('div')(() => ({
  '&, & .katex': { color: 'var(--color-foreground)' },
  display: 'flex',
  flexDirection: 'column',
  gap: token.Spacing.SpacingL,
}));

const FAKE_STREAM_CHARS_COUNT = 10;
const FAKE_STREAM_INTERVAL = 50;
const CHUNK_QUEUE_PROCESS_INTERVAL = 50;

/**
 * Patterns for tokens that should be buffered when incomplete during streaming.
 * Each pattern should match the START of an incomplete token (opened but not yet closed).
 * Add new patterns here as needed.
 *
 * Pattern format: Match the opening sequence with a negative lookahead for the closing sequence.
 * Example: /\[\[my-token:(?![^\]]*\]\])/ matches `[[my-token:` not followed by `]]`
 */
const INCOMPLETE_TOKEN_PATTERNS: RegExp[] = [
  /\[\[resource-token:(?!.*\]\])/, // [[resource-token:{...}]]
];

/**
 * Extracts content that is safe to render, buffering any incomplete tokens.
 * This prevents flickering during streaming when tokens arrive in chunks.
 *
 * @param content - The accumulated content string
 * @returns An object with `renderable` (safe to display) and `buffered` (held back for next chunk)
 */
function extractRenderableContent(content: string): { renderable: string; buffered: string } {
  let earliestIndex = -1;

  for (const pattern of INCOMPLETE_TOKEN_PATTERNS) {
    const match = content.match(pattern);
    if (match?.index !== undefined) {
      if (earliestIndex === -1 || match.index < earliestIndex) {
        earliestIndex = match.index;
      }
    }
  }

  if (earliestIndex === -1) {
    return { renderable: content, buffered: '' };
  }

  return {
    renderable: content.slice(0, earliestIndex),
    buffered: content.slice(earliestIndex),
  };
}

function AutopilotChatMarkdownRendererComponent({ message }: { message: AutopilotChatMessage }) {
  const { _ } = useLingui();
  // Only store message ID and content separately to minimize re-renders
  const messageId = React.useRef(message.id);

  // Generate initial content from contentParts if available, otherwise use message.content
  const getInitialContent = React.useCallback(() => {
    if (message.contentParts && message.contentParts.length > 0) {
      return contentPartsToMarkdown(messageId.current, message.contentParts);
    }
    return message.content || '';
  }, [message.contentParts, message.content]);

  const [content, setContent] = React.useState(message.fakeStream ? '' : getInitialContent());
  const chatService = useChatService();
  const { spacing } = useChatState();
  const { setStreaming } = useStreaming();
  const { isStreaming } = useIsStreamingMessage(message);
  const chunkQueue = React.useRef<string[]>([]);
  const lastChunkQueueProcessedTime = React.useRef<number>(0);
  const incompleteTokenBuffer = React.useRef<string>('');

  // Update the message ID ref if a new message is passed
  React.useEffect(() => {
    let unsubscribeStopResponse: (() => void) | undefined;
    let fakeStreamInterval: ReturnType<typeof setInterval> | undefined;

    if (message.id !== messageId.current || !message.stream) {
      messageId.current = message.id;
      setContent(message.fakeStream ? '' : getInitialContent());
    }

    if (message.fakeStream) {
      unsubscribeStopResponse = chatService.on(AutopilotChatEvent.StopResponse, () => {
        clearInterval(fakeStreamInterval);
        setStreaming(false);
        setContent(getInitialContent());
        chunkQueue.current = [];
        incompleteTokenBuffer.current = '';
        lastChunkQueueProcessedTime.current = 0;
      });

      const characters = getInitialContent().split('');
      let charIndex = 0;

      setStreaming(true);

      fakeStreamInterval = setInterval(() => {
        if (charIndex < characters.length) {
          const chunkSize = FAKE_STREAM_CHARS_COUNT;
          const endIndex = Math.min(charIndex + chunkSize, characters.length);
          const chunk = characters.slice(charIndex, endIndex).join('');

          setContent((prevContent) => `${prevContent}${chunk}`);

          charIndex = endIndex;
        } else {
          clearInterval(fakeStreamInterval);
          setStreaming(false);
        }
      }, FAKE_STREAM_INTERVAL);
    }

    return () => {
      unsubscribeStopResponse?.();

      if (fakeStreamInterval) {
        clearInterval(fakeStreamInterval);
      }
    };
  }, [message, chatService, setStreaming, getInitialContent]);

  const handleSendChunk = React.useCallback((msg: AutopilotChatMessage) => {
    if (msg.id !== messageId.current) {
      return;
    }

    chunkQueue.current.push(msg.content);

    if (Date.now() - lastChunkQueueProcessedTime.current > CHUNK_QUEUE_PROCESS_INTERVAL) {
      lastChunkQueueProcessedTime.current = Date.now();

      if (msg.contentParts) {
        const fullContent = contentPartsToMarkdown(messageId.current, msg.contentParts);
        const { renderable } = extractRenderableContent(fullContent);
        setContent(renderable);
        return;
      }

      // Combine buffered incomplete token with new chunks
      const accumulated = incompleteTokenBuffer.current + chunkQueue.current.join('');
      const { renderable, buffered } = extractRenderableContent(accumulated);

      incompleteTokenBuffer.current = buffered;
      chunkQueue.current = [];

      if (renderable) {
        setContent((prevContent) => `${prevContent}${renderable}`);
      }
    } else if (msg.done) {
      lastChunkQueueProcessedTime.current = 0;

      if (msg.contentParts) {
        setContent(contentPartsToMarkdown(messageId.current, msg.contentParts));
        return;
      }

      // Stream complete - flush everything including any incomplete tokens
      const remaining = incompleteTokenBuffer.current + chunkQueue.current.join('');
      incompleteTokenBuffer.current = '';
      chunkQueue.current = [];
      setContent((prevContent) => `${prevContent}${remaining}`);
    }
  }, []);

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    const unsubscribe = chatService.on(AutopilotChatEvent.SendChunk, handleSendChunk);

    return () => {
      unsubscribe();
    };
  }, [chatService, handleSendChunk]);

  const components = React.useMemo(
    () => ({
      ul: Ul,
      ol: Ol,
      li: Li,
      p: React.memo(getTextForVariant(spacing.markdownTokens.p)),
      h1: React.memo(getTextForVariant(spacing.markdownTokens.h1, 1)),
      h2: React.memo(getTextForVariant(spacing.markdownTokens.h2, 2)),
      h3: React.memo(getTextForVariant(spacing.markdownTokens.h3, 3)),
      h4: React.memo(getTextForVariant(spacing.markdownTokens.h4, 4)),
      h5: React.memo(getTextForVariant(spacing.markdownTokens.h5, 5)),
      h6: React.memo(getTextForVariant(spacing.markdownTokens.h6, 6)),
      br: Break,
      table: Table,
      thead: TableHeader,
      tr: Row,
      th: HeaderCell,
      td: Cell,
      img: ({ src }: { src?: string }) => src || '',
      code: (props: any) => <Code {...props} isStreaming={isStreaming ?? false} />,
      blockquote: Blockquote,
      em: Emphazised,
      del: Del,
      strong: Strong,
      hr: Hr,
      pre: Pre,
      a: Link,
      citation: Citation,
      'resource-chip': ResourceChip,
    }),
    [spacing, isStreaming]
  );

  return React.useMemo(
    () => (
      <MarkdownContainer>
        <ReactMarkdown
          remarkPlugins={[
            citationPlugin,
            resourceTokenPlugin,
            remarkGfm,
            [remarkMath, { singleDollarTextMath: false }],
          ]}
          rehypePlugins={[
            [
              rehypeKatex,
              {
                output: 'mathml',
                trust: false,
                strict: true,
                throwOnError: false,
              },
            ],
          ]}
          remarkRehypeOptions={{
            footnoteLabel: _(
              msg({ id: 'autopilot-chat.message.footnote-label', message: `Footnotes` })
            ),
          }}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </MarkdownContainer>
    ),
    [content, components, _]
  );
}

export const AutopilotChatMarkdownRenderer = React.memo(AutopilotChatMarkdownRendererComponent);
