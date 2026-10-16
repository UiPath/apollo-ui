import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Markdown, type MarkdownCodeBlock, type MarkdownProps } from '@uipath/apollo-wind';
import React from 'react';

import { useIsStreamingMessage } from '../../headless/hooks/use-is-streaming-message';
import { useStreamedMessageContent } from '../../headless/hooks/use-streamed-message-content';
import { citationPlugin } from '../../headless/markdown/citation-parser';
import { resourceTokenPlugin } from '../../headless/markdown/resource-token-parser';
import { useChatState } from '../../headless/providers/chat-state-provider';
import type { AutopilotChatMessage } from '../../service';
import { CitationHighlightsContext, useCitationHighlights } from './citation-highlights';
import { CodeBlockActions } from './code-block-actions';
import { MarkdownCitation } from './markdown-citation';
import { MarkdownResourceChip } from './markdown-resource-chip';

const REMARK_PLUGINS: MarkdownProps['remarkPlugins'] = [citationPlugin, resourceTokenPlugin];

// The plugins' custom nodes; react-markdown's types only list HTML elements.
const COMPONENTS = {
  citation: MarkdownCitation,
  'resource-chip': MarkdownResourceChip,
} as unknown as MarkdownProps['components'];

function useMarkdownStrings(): MarkdownProps['strings'] {
  const { _ } = useLingui();

  return React.useMemo(
    () => ({
      copy: _(msg({ id: 'autopilot-chat.message.code-block-copy', message: `Copy code` })),
      copied: _(msg({ id: 'autopilot-chat.message.actions.copied', message: `Copied` })),
      plainText: _(msg({ id: 'autopilot-chat.message.code-block-language', message: `Code` })),
      footnotes: _(msg({ id: 'autopilot-chat.message.footnote-label', message: `Footnotes` })),
      footnoteBack: _(
        msg({ id: 'autopilot-chat.message.footnote-back', message: `Back to content` })
      ),
      taskDone: _(msg({ id: 'autopilot-chat.message.task-done', message: `Done` })),
      taskOpen: _(msg({ id: 'autopilot-chat.message.task-open', message: `Not done` })),
    }),
    [_]
  );
}

/**
 * The Wind default message body: markdown with citations and resource chips, following streamed
 * chunks as Material does. Only this component re-renders per chunk.
 */
function MarkdownMessageRendererComponent({ message }: { message: AutopilotChatMessage }) {
  const { content, fakeStreaming } = useStreamedMessageContent(message);
  const { isStreaming } = useIsStreamingMessage(message);
  const { disabledFeatures } = useChatState();
  const strings = useMarkdownStrings();
  const streaming = !!isStreaming || fakeStreaming;
  const htmlPreview = !disabledFeatures.htmlPreview;
  const highlights = useCitationHighlights(content, streaming);

  const renderCodeActions = React.useCallback(
    (block: MarkdownCodeBlock) => (
      <CodeBlockActions block={block} htmlPreview={htmlPreview} streaming={streaming} />
    ),
    [htmlPreview, streaming]
  );

  return (
    <CitationHighlightsContext.Provider value={highlights}>
      <Markdown
        streaming={streaming}
        codeWrap
        remarkPlugins={REMARK_PLUGINS}
        components={COMPONENTS}
        renderCodeActions={renderCodeActions}
        strings={strings}
      >
        {content}
      </Markdown>
    </CitationHighlightsContext.Provider>
  );
}

export const MarkdownMessageRenderer = React.memo(MarkdownMessageRendererComponent);
