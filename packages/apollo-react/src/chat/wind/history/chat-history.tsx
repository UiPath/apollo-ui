import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import React from 'react';

import { useChatHistory } from '../../headless/hooks/use-chat-history';
import { useChatService } from '../../headless/providers/chat-service.provider';
import { useChatState } from '../../headless/providers/chat-state-provider';
import type { AutopilotChatMode } from '../../service';
import { PanelPopover } from '../common/panel-popover';
import { HistoryPanel } from './history-panel';

/**
 * The history: a popover under the header's history button, over the conversation, in both
 * modes. Unlike Material's it is not modal, so a host dialog opened from a pre-hook stays usable.
 * The list state lives here, mounted while the popover is closed, so it keeps whether the host
 * has more items between openings.
 */
export function ChatHistory({
  boundary,
  mode,
}: {
  boundary: HTMLElement | null;
  mode: AutopilotChatMode;
}) {
  const { _ } = useLingui();
  const chatService = useChatService();
  const { historyOpen, historyAnchorElement } = useChatState();
  const [scrollContainer, setScrollContainer] = React.useState<HTMLDivElement | null>(null);
  const history = useChatHistory({ open: historyOpen, scrollContainer });

  return (
    <PanelPopover
      open={historyOpen}
      anchor={historyAnchorElement}
      boundary={boundary}
      mode={mode}
      label={_(msg({ id: 'autopilot-chat.header.actions.history', message: `History` }))}
      // Material's popover closes without the ToggleHistory pre-hook.
      onClose={() => chatService.toggleHistory(false)}
      onEscapeKeyDown={(event) => {
        // Escape in the rename field cancels the rename and leaves the history open.
        if (event.target instanceof Element && event.target.closest('[data-renaming]')) {
          event.preventDefault();
        }
      }}
      className="py-2"
    >
      <HistoryPanel className="flex-1" history={history} scrollContainerRef={setScrollContainer} />
    </PanelPopover>
  );
}
