import React from 'react';

import { useInjectedMessageRenderer } from '../../headless/hooks/use-injected-message-renderer';
import type { AutopilotChatMessage } from '../../service';

/** A DOM slot for a renderer injected with `render(container, message)`. */
export function InjectedMessage({ message }: { message: AutopilotChatMessage }) {
  const ref = React.useRef<HTMLDivElement>(null);
  useInjectedMessageRenderer(ref, message);

  return (
    <div
      ref={ref}
      data-slot="wind-chat-injected-message"
      className="chat-widget-container w-full"
    />
  );
}
