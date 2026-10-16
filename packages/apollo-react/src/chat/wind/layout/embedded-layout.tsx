import type { ChatLayout } from '../../headless/layout/chat-layout';
import { useChatState } from '../../headless/providers/chat-state-provider';
import { WindChatHeader } from '../header/chat-header';
import { ComposerRegion, HistoryRegion, MessagesRegion, SettingsRegion } from './regions';

/**
 * The panel layout: header, messages and composer in one column, with history and settings
 * covering the area below the header when open.
 */
export function EmbeddedLayout({ layout }: { layout: ChatLayout }) {
  const { historyOpen, settingsOpen, spacing } = useChatState();
  const gutter = spacing.compactMode ? 'px-3' : 'px-4';

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      {layout.showHeader && <WindChatHeader className={gutter} layout={layout} />}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          className={
            spacing.compactMode
              ? 'flex min-h-0 flex-1 flex-col gap-2 px-3 py-2'
              : 'flex min-h-0 flex-1 flex-col gap-3 px-4 py-3'
          }
        >
          <MessagesRegion />
          {layout.showComposer && <ComposerRegion />}
        </div>
        {layout.historyAvailable && historyOpen && (
          <div className="absolute inset-0 z-10 p-2">
            <HistoryRegion />
          </div>
        )}
        {layout.settingsAvailable && settingsOpen && (
          <div className="absolute inset-0 z-10 p-2">
            <SettingsRegion />
          </div>
        )}
      </div>
    </div>
  );
}
