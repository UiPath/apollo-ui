import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Badge, cn } from '@uipath/apollo-wind';
import { History, MessageCirclePlus, Minus, Settings } from 'lucide-react';

import { AutopilotLogo } from '../../assets/autopilot-logo';
import { useChatHeaderActions } from '../../headless/hooks/use-chat-header-actions';
import { useChatLabels } from '../../headless/hooks/use-chat-labels';
import type { ChatLayout } from '../../headless/layout/chat-layout';
import { useChatState } from '../../headless/providers/chat-state-provider';
import { AutopilotChatMode } from '../../service';
import { CustomActionsMenu } from './custom-actions-menu';
import { HeaderActionButton } from './header-action-button';

/**
 * Title, logo (FullScreen only), preview badge and actions. The expand/collapse toggle is left out:
 * collapsing leads to SideBySide, which the Wind renderer does not support yet.
 *
 * Follows the layout's mode rather than the live one, so it stays as it was while the chat fades
 * out after closing.
 */
export function WindChatHeader({ className, layout }: { className?: string; layout: ChatLayout }) {
  const { _ } = useLingui();
  const {
    disabledFeatures,
    spacing,
    historyOpen,
    settingsOpen,
    setHistoryAnchorElement,
    setSettingsAnchorElement,
  } = useChatState();
  const { title } = useChatLabels();
  const {
    visibility,
    customHeaderActions,
    newChat,
    toggleSettings,
    toggleHistory,
    close,
    runCustomAction,
  } = useChatHeaderActions({ mode: layout.mode });
  const compact = spacing.compactMode;

  return (
    <header
      data-slot="wind-chat-header"
      data-separator={layout.showHeaderSeparator ? '' : undefined}
      className={cn(
        'flex shrink-0 items-center justify-between gap-2 data-separator:border-b data-separator:border-border-de-emp',
        // Material's header: a 32px row with 16px above and below (8px each when compact), or 8px
        // above and a 4px gap over the separator. Heights include the padding.
        layout.showHeaderSeparator
          ? 'min-h-11 pt-2 pb-1'
          : compact
            ? 'min-h-12 py-2'
            : 'min-h-16 py-4',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {layout.mode === AutopilotChatMode.FullScreen && (
          <AutopilotLogo className="shrink-0" data-slot="autopilot-logo" />
        )}
        <h1
          className={
            compact
              ? 'truncate text-sm font-semibold text-foreground'
              : 'truncate text-base font-semibold text-foreground'
          }
        >
          {title}
        </h1>
        {!disabledFeatures.preview && (
          <Badge variant="info" className="shrink-0 px-1.5 py-0 text-[10px] leading-4">
            {_(msg({ id: 'autopilot-chat.header.preview', message: `Preview` }))}
          </Badge>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {visibility.newChat && (
          <HeaderActionButton
            label={_(msg({ id: 'autopilot-chat.header.actions.new-chat', message: `New chat` }))}
            onClick={newChat}
            data-testid="autopilot-chat-new-chat"
          >
            <MessageCirclePlus />
          </HeaderActionButton>
        )}
        {visibility.settings && (
          <HeaderActionButton
            label={_(msg({ id: 'autopilot-chat.header.actions.settings', message: `Settings` }))}
            // Focus returns here when the settings close.
            ref={setSettingsAnchorElement}
            onClick={toggleSettings}
            aria-expanded={settingsOpen}
            data-testid="autopilot-chat-settings"
          >
            <Settings />
          </HeaderActionButton>
        )}
        {visibility.history && (
          <HeaderActionButton
            label={_(msg({ id: 'autopilot-chat.header.actions.history', message: `History` }))}
            // The history popover anchors to this button.
            ref={setHistoryAnchorElement}
            onClick={toggleHistory}
            aria-expanded={historyOpen}
            aria-haspopup="dialog"
            data-testid="autopilot-chat-history"
          >
            <History />
          </HeaderActionButton>
        )}
        {visibility.customActions && (
          <CustomActionsMenu actions={customHeaderActions} onAction={runCustomAction} />
        )}
        {visibility.close && (
          <HeaderActionButton
            label={_(msg({ id: 'autopilot-chat.header.actions.close', message: `Close` }))}
            onClick={close}
            data-testid="autopilot-chat-close"
          >
            <Minus />
          </HeaderActionButton>
        )}
      </div>
    </header>
  );
}
