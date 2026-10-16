import { ThinkingIndicator } from '@uipath/apollo-wind';

import { useLoadingMessages } from '../../headless/hooks/use-loading-messages';

/** The thinking state: the loading provider's messages, rotating. */
export function ThinkingRow() {
  const { messages, duration, translate } = useLoadingMessages();
  // As in Material, `setLoadingMessage('')` shows an empty label; the accessible name stays.
  const labels = messages.map(translate);

  return (
    <ThinkingIndicator
      data-slot="wind-chat-thinking"
      messages={labels}
      interval={duration}
      label={translate('autopilot-chat-generating-response')}
    />
  );
}
