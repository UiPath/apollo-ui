import { useChatLabels } from '../../headless/hooks/use-chat-labels';
import { useChatState } from '../../headless/providers/chat-state-provider';
import { PlaceholderRegion } from './placeholder-region';

// Each region is replaced by its real implementation as the Wind renderer is built out.

export function MessagesRegion() {
  return (
    <PlaceholderRegion name="Messages" slot="wind-chat-messages" className="min-h-0 flex-1">
      Message list: not available in the Wind renderer yet.
    </PlaceholderRegion>
  );
}

/**
 * Shows the configured placeholder and footer disclaimer, so label overrides are visible before
 * the real composer replaces this region.
 */
export function ComposerRegion() {
  const { inputPlaceholder, footerDisclaimer } = useChatLabels();
  const { disabledFeatures } = useChatState();

  return (
    <div data-slot="wind-chat-composer" className="flex shrink-0 flex-col gap-1.5">
      <PlaceholderRegion
        name="Composer"
        slot="wind-chat-composer-input"
        className="min-h-24 flex-col items-start justify-between text-left"
      >
        <span data-slot="composer-placeholder" className="text-muted-foreground">
          {inputPlaceholder}
        </span>
        <span className="self-end text-xs">Composer: not available in the Wind renderer yet.</span>
      </PlaceholderRegion>
      {!disabledFeatures.footer && (
        <p data-slot="composer-footer" className="text-center text-[10px] text-muted-foreground">
          {footerDisclaimer}
        </p>
      )}
    </div>
  );
}

export function HistoryRegion() {
  return (
    <PlaceholderRegion
      name="History"
      slot="wind-chat-history"
      className="h-full w-full bg-background"
    >
      Chat history: not available in the Wind renderer yet.
    </PlaceholderRegion>
  );
}

export function SettingsRegion() {
  return (
    <PlaceholderRegion
      name="Settings"
      slot="wind-chat-settings"
      className="h-full w-full bg-background"
    >
      Settings: not available in the Wind renderer yet.
    </PlaceholderRegion>
  );
}
