import React from 'react';

import { useWelcomeContent } from '../../headless/hooks/use-welcome-content';
import { useChatState } from '../../headless/providers/chat-state-provider';

function WelcomeContentSlot() {
  const host = React.useRef<HTMLDivElement>(null);
  useWelcomeContent(host);

  return (
    <div
      ref={host}
      data-slot="wind-chat-welcome-content"
      // Full width and start-aligned in both hero layouts; no gap of its own while the host has
      // rendered nothing.
      className="w-full min-w-0 text-start text-foreground has-[>:empty]:hidden"
    />
  );
}

/**
 * The host's `welcomeContent` in the first-run experience, under the welcome text. Render it
 * only while the first-run experience shows: mounting hands the container to the host, and
 * unmounting empties it.
 */
export function WelcomeContent() {
  const { hasWelcomeContent } = useChatState();
  return hasWelcomeContent ? <WelcomeContentSlot /> : null;
}
