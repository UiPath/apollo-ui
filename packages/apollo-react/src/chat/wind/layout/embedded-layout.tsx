import type { ChatLayout } from '../../headless/layout/chat-layout';
import { useChatState } from '../../headless/providers/chat-state-provider';
import { WindChatHeader } from '../header/chat-header';
import { MessageList } from '../messages/message-list';
import { ComposerRegion, HistoryRegion, SettingsRegion } from './regions';

/**
 * The panel layout: header, messages and composer in one column, with history and settings
 * covering the area below the header when open.
 */
export function EmbeddedLayout({ layout }: { layout: ChatLayout }) {
  const { historyOpen, settingsOpen, spacing } = useChatState();
  // Material's panel gutter (SpacingL) in both densities, so the renderers line up.
  const gutter = 'px-6';

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      {layout.showHeader && <WindChatHeader className={gutter} layout={layout} />}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <MessageList />
          {layout.showComposer && (
            <div className={spacing.compactMode ? 'px-6 pb-1' : 'px-6 pb-2'}>
              <ComposerRegion />
            </div>
          )}
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
