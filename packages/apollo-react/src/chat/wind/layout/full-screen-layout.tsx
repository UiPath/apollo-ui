import React from 'react';

import type { ChatLayout } from '../../headless/layout/chat-layout';
import { useChatState } from '../../headless/providers/chat-state-provider';
import { CHAT_DRAWER_WIDTH_FULL_SCREEN, CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH } from '../../service';
import { FirstRun, useFirstRunShown } from '../first-run/first-run';
import { WindChatHeader } from '../header/chat-header';
import { ChatHistory } from '../history/chat-history';
import { MessageList } from '../messages/message-list';
import { ChatSettings, useSettingsClose } from '../settings/chat-settings';
import { ComposerRegion } from './regions';

const sizes = {
  '--chat-column-max-width': CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
  '--chat-drawer-width': `${CHAT_DRAWER_WIDTH_FULL_SCREEN}px`,
} as React.CSSProperties;

/**
 * Full-width header above a centered conversation column. The history opens as a popover and the
 * settings slide in on the right; the column makes room for either, as Material's does.
 */
export function FullScreenLayout({ layout }: { layout: ChatLayout }) {
  const firstRunShown = useFirstRunShown();
  const settingsClose = useSettingsClose();
  const { historyOpen } = useChatState();
  const [content, setContent] = React.useState<HTMLDivElement | null>(null);

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col"
      style={sizes}
      onKeyDown={settingsClose.onKeyDown}
    >
      <WindChatHeader className="px-6" layout={layout} />
      <div ref={setContent} className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Hidden rather than unmounted during the first run: it owns the transcript state. */}
          <MessageList
            className={firstRunShown ? 'hidden' : undefined}
            contentClassName="mx-auto w-full max-w-[var(--chat-column-max-width)]"
          />
          {/* The composer sits in the centered first-run column, then below the transcript, in
              the same place in the tree, so it is not remounted when the first message lands. */}
          {(layout.showComposer || firstRunShown) && (
            <FirstRun
              layout="centered"
              className="max-w-[var(--chat-column-max-width)] px-6 py-6"
              wrapperClassName="max-w-[var(--chat-column-max-width)] px-6 pb-2"
            >
              {layout.showComposer && (
                <div className="w-full">
                  <ComposerRegion />
                </div>
              )}
            </FirstRun>
          )}
        </main>
        {/* The history popover's place beside the column, kept clear of the transcript. */}
        {layout.historyAvailable && historyOpen && (
          <div aria-hidden className="w-[calc(var(--chat-drawer-width)+2rem)] shrink-0" />
        )}
        {layout.settingsAvailable && <ChatSettings layout={layout} onClose={settingsClose.close} />}
        {layout.historyAvailable && <ChatHistory boundary={content} mode={layout.mode} />}
      </div>
    </div>
  );
}
