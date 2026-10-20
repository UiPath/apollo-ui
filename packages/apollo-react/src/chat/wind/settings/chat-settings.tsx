import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { cn } from '@uipath/apollo-wind';
import { X } from 'lucide-react';
import React from 'react';

import { useSettingsRenderer } from '../../headless/hooks/use-settings-renderer';
import type { ChatLayout } from '../../headless/layout/chat-layout';
import { useChatService } from '../../headless/providers/chat-service.provider';
import { useChatState } from '../../headless/providers/chat-state-provider';
import {
  AutopilotChatMode,
  AutopilotChatPreHookAction,
  CHAT_HISTORY_FULL_SCREEN_WIDTH,
} from '../../service';
import { HeaderActionButton } from '../header/header-action-button';

/** The history popover's surface, so the two panels read as one family. */
const PANEL_SURFACE =
  'rounded-md border bg-popover text-popover-foreground shadow-md future:rounded-lg';

/**
 * Closing the settings from the panel: the ToggleSettings pre-hook, then an explicit close, so a
 * second request while the pre-hook runs (a held Escape, a double click) cannot reopen them.
 * Focus returns to the header's settings button. `onKeyDown` closes on Escape: put it on the
 * layout root, so Escape anywhere in the chat closes the open panel, after Wind's own handlers
 * have had the chance to take it.
 */
export function useSettingsClose() {
  const chatService = useChatService();
  const { settingsOpen, settingsAnchorElement } = useChatState();
  const pending = React.useRef(false);

  const close = React.useCallback(() => {
    if (pending.current || !chatService.settingsOpen) {
      return;
    }
    pending.current = true;
    chatService
      .getPreHook(AutopilotChatPreHookAction.ToggleSettings)({ settingsOpen: true })
      .then((proceed) => {
        if (proceed && chatService.settingsOpen) {
          chatService.toggleSettings(false);
          settingsAnchorElement?.focus();
        }
      })
      .catch(() => {})
      .finally(() => {
        pending.current = false;
      });
  }, [chatService, settingsAnchorElement]);

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (
        settingsOpen &&
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        !event.repeat &&
        !event.nativeEvent.isComposing
      ) {
        close();
      }
    },
    [settingsOpen, close]
  );

  return { close, onKeyDown };
}

/**
 * The settings panel, sliding in from the right as Material's does: over the conversation in a
 * panel (Embedded), beside it in FullScreen, where the conversation makes room as it opens. It
 * closes from its X, the header's settings button or Escape in the chat (`useSettingsClose`), all
 * through the ToggleSettings pre-hook.
 *
 * It stays mounted while closed, so the element the host renders into (CAS mounts a React root
 * in it) is the same for the chat's life; it is emptied on close and handed to the renderer
 * again on each opening, as in Material.
 */
export function ChatSettings({ layout, onClose }: { layout: ChatLayout; onClose: () => void }) {
  const { _ } = useLingui();
  const { settingsOpen, settingsAnchorElement } = useChatState();
  const [content, setContent] = React.useState<HTMLDivElement | null>(null);
  const panel = React.useRef<HTMLElement>(null);
  const close = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();
  const fullScreen = layout.mode === AutopilotChatMode.FullScreen;
  useSettingsRenderer(content);

  // Focus moves into the panel on open, and back to the settings button when it closes with
  // focus inside (the host closing it, say).
  const wasOpen = React.useRef(settingsOpen);
  React.useEffect(() => {
    if (settingsOpen && !wasOpen.current) {
      close.current?.focus();
    } else if (
      !settingsOpen &&
      wasOpen.current &&
      panel.current?.contains(document.activeElement)
    ) {
      settingsAnchorElement?.focus();
    }
    wasOpen.current = settingsOpen;
  }, [settingsOpen, settingsAnchorElement]);

  const title = _(msg({ id: 'autopilot-chat.settings.title', message: `Settings` }));

  const card = (
    <section
      ref={panel}
      aria-labelledby={titleId}
      data-slot="wind-chat-settings"
      data-state={settingsOpen ? 'open' : 'closed'}
      className={cn(
        PANEL_SURFACE,
        'absolute flex flex-col gap-2 py-2',
        // Closed, it is invisible as well as out of view, so it leaves the tab order.
        'transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none',
        'data-[state=closed]:invisible data-[state=closed]:translate-x-[calc(100%+1rem)]',
        fullScreen
          ? 'top-1 right-4 bottom-4 w-[var(--chat-settings-width)]'
          : 'inset-x-4 top-1 bottom-4 z-20'
      )}
      style={
        fullScreen
          ? ({
              '--chat-settings-width': `${CHAT_HISTORY_FULL_SCREEN_WIDTH}px`,
            } as React.CSSProperties)
          : undefined
      }
    >
      <div className="flex shrink-0 items-center justify-between gap-2 pr-2 pl-4">
        <h2 id={titleId} className="truncate text-sm font-semibold text-foreground">
          {title}
        </h2>
        <HeaderActionButton
          ref={close}
          label={_(msg({ id: 'autopilot-chat.settings.hide', message: `Hide settings` }))}
          onClick={onClose}
          data-testid="autopilot-chat-settings-close"
        >
          <X />
        </HeaderActionButton>
      </div>
      <div
        ref={setContent}
        data-slot="wind-chat-settings-content"
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4"
      />
    </section>
  );

  if (!fullScreen) {
    return card;
  }

  // FullScreen: the panel's place beside the conversation, which narrows as it opens.
  return (
    <div
      data-slot="wind-chat-settings-place"
      className={cn(
        'relative shrink-0 overflow-hidden transition-[width] duration-300 ease-out motion-reduce:transition-none',
        settingsOpen ? 'w-[calc(var(--chat-drawer-width)+2rem)]' : 'w-0'
      )}
    >
      {card}
    </div>
  );
}
