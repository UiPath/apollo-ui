import { WindChatComposer } from '../composer/chat-composer';
import { PlaceholderRegion } from './placeholder-region';

// Each region is replaced by its real implementation as the Wind renderer is built out.

/** The prompt input, with its error and footer disclaimer. */
export function ComposerRegion() {
  return (
    <div data-slot="wind-chat-composer" className="flex shrink-0 flex-col">
      <WindChatComposer />
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
