import React from 'react';

import type { ChatLayout } from '../../headless/layout/chat-layout';
import { useChatState } from '../../headless/providers/chat-state-provider';
import { FirstRun, useFirstRunShown } from '../first-run/first-run';
import { WindChatHeader } from '../header/chat-header';
import { ChatHistory } from '../history/chat-history';
import { MessageList } from '../messages/message-list';
import { ChatSettings, useSettingsClose } from '../settings/chat-settings';
import { ComposerRegion } from './regions';

/**
 * The panel layout: header, messages and composer in one column. The history opens as a popover
 * under the header; the settings slide in over the conversation below it.
 */
export function EmbeddedLayout({ layout }: { layout: ChatLayout }) {
  const { spacing, settingsOpen } = useChatState();
  const firstRunShown = useFirstRunShown();
  const settingsClose = useSettingsClose();
  // Material's panel gutter (SpacingL) in both densities, so the renderers line up.
  const gutter = 'px-6';
  const [root, setRoot] = React.useState<HTMLDivElement | null>(null);
  const conversation = React.useRef<HTMLDivElement>(null);

  // Material traps focus in its settings panel here; the conversation under it leaves the tab
  // order and the accessibility tree while it is open.
  React.useEffect(() => {
    conversation.current?.toggleAttribute('inert', layout.settingsAvailable && settingsOpen);
  }, [layout.settingsAvailable, settingsOpen]);

  return (
    <div
      ref={setRoot}
      className="relative flex h-full min-h-0 w-full flex-col"
      onKeyDown={settingsClose.onKeyDown}
    >
      {layout.showHeader && <WindChatHeader className={gutter} layout={layout} />}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div ref={conversation} className="flex min-h-0 flex-1 flex-col">
          {/* Hidden rather than unmounted during the first run: it owns the transcript state. */}
          <MessageList className={firstRunShown ? 'hidden' : undefined} />
          {/* Docked at the bottom of the message area, above the composer, as Material's is. */}
          {firstRunShown && (
            <FirstRun layout="docked" className="min-h-0 overflow-y-auto px-6 pt-3 pb-6" />
          )}
          {layout.showComposer && (
            <div className={spacing.compactMode ? 'px-6 pb-1' : 'px-6 pb-2'}>
              <ComposerRegion />
            </div>
          )}
        </div>
        {layout.settingsAvailable && <ChatSettings layout={layout} onClose={settingsClose.close} />}
      </div>
      {layout.historyAvailable && <ChatHistory boundary={root} mode={layout.mode} />}
    </div>
  );
}
