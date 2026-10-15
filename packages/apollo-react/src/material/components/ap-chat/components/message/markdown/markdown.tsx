// Import Katex CSS
import 'katex/dist/katex.min.css';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { styled } from '@mui/material';
import token from '@uipath/apollo-core';
import { useIsStreamingMessage } from '@uipath/apollo-react/chat/headless/hooks/use-is-streaming-message';
import { useStreamedMessageContent } from '@uipath/apollo-react/chat/headless/hooks/use-streamed-message-content';
import { citationPlugin } from '@uipath/apollo-react/chat/headless/markdown/citation-parser';
import { resourceTokenPlugin } from '@uipath/apollo-react/chat/headless/markdown/resource-token-parser';
import { useChatState } from '@uipath/apollo-react/chat/headless/providers/chat-state-provider';
import type { AutopilotChatMessage } from '@uipath/apollo-react/chat/service';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { Citation } from './citation';
import { Code } from './code';
import { Li, Ol, Ul } from './lists';
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

function AutopilotChatMarkdownRendererComponent({ message }: { message: AutopilotChatMessage }) {
  const { _ } = useLingui();
  const { content } = useStreamedMessageContent(message);
  const { spacing } = useChatState();
  const { isStreaming } = useIsStreamingMessage(message);

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
