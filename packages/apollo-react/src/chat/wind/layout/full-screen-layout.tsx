import type React from 'react';

import type { ChatLayout } from '../../headless/layout/chat-layout';
import { useChatState } from '../../headless/providers/chat-state-provider';
import { CHAT_DRAWER_WIDTH_FULL_SCREEN, CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH } from '../../service';
import { WindChatHeader } from '../header/chat-header';
import { ComposerRegion, HistoryRegion, MessagesRegion, SettingsRegion } from './regions';

const sizes = {
  '--chat-column-max-width': CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
  '--chat-drawer-width': `${CHAT_DRAWER_WIDTH_FULL_SCREEN}px`,
} as React.CSSProperties;

/**
 * Full-width header above a centered conversation column, with history and settings as drawers
 * on the right.
 */
export function FullScreenLayout({ layout }: { layout: ChatLayout }) {
  const { historyOpen, settingsOpen, spacing } = useChatState();

  return (
    <div className="flex h-full min-h-0 w-full flex-col" style={sizes}>
      <WindChatHeader className={spacing.compactMode ? 'px-4' : 'px-6'} layout={layout} />
      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col px-6 py-4">
          <div className="mx-auto flex h-full min-h-0 w-full max-w-[var(--chat-column-max-width)] flex-col gap-3">
            <MessagesRegion />
            {layout.showComposer && <ComposerRegion />}
          </div>
        </main>
        {layout.historyAvailable && historyOpen && (
          <aside className="w-[var(--chat-drawer-width)] shrink-0 border-l border-border-de-emp p-2">
            <HistoryRegion />
          </aside>
        )}
        {layout.settingsAvailable && settingsOpen && (
          <aside className="w-[var(--chat-drawer-width)] shrink-0 border-l border-border-de-emp p-2">
            <SettingsRegion />
          </aside>
        )}
      </div>
    </div>
  );
}
