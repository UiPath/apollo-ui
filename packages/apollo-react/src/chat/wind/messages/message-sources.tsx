import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { SourceItem, Sources, SourcesList } from '@uipath/apollo-wind';
import { FileText, Globe } from 'lucide-react';

import { useMessageSources, useOpenCitation } from '../../headless/hooks/use-citations';
import { useIsStreamingMessage } from '../../headless/hooks/use-is-streaming-message';
import type { AutopilotChatMessage } from '../../service';

/**
 * The cited sources of a reply's group, collapsed under the reply. Hidden while it streams or
 * while the host says more of the group is coming, as in Material.
 */
export function MessageSources({ message }: { message: AutopilotChatMessage }) {
  const { _ } = useLingui();
  const { sources, isWaitingForMoreMessages } = useMessageSources(message);
  const { isStreaming } = useIsStreamingMessage(message);
  const openCitation = useOpenCitation();

  if (isWaitingForMoreMessages || isStreaming || sources.length === 0) {
    return null;
  }

  const label = _(msg({ id: 'autopilot-chat.message.sources', message: `Sources` }));

  return (
    <Sources
      data-slot="wind-chat-sources"
      count={sources.length}
      // Material labels the list "Sources" without a count; kept so both read the same.
      strings={{ sourceCount: () => label }}
      className="mt-2"
    >
      <SourcesList>
        {sources.map((source) => {
          const page_number = 'page_number' in source ? source.page_number : undefined;
          const page = page_number
            ? _(msg({ id: 'autopilot-chat.message.page-number', message: `Page ${page_number}` }))
            : undefined;

          return (
            <SourceItem
              key={source.id}
              index={source.id}
              title={source.title}
              source={page}
              icon={'url' in source ? <Globe /> : <FileText />}
              onSelect={() => openCitation(source)}
            />
          );
        })}
      </SourcesList>
    </Sources>
  );
}
