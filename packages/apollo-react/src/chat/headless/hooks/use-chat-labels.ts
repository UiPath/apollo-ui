import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';

import { useChatState } from '../providers/chat-state-provider';

export interface ChatLabels {
  title: string;
  inputPlaceholder: string;
  footerDisclaimer: string;
}

/**
 * The service's `overrideLabels`, falling back to the localized defaults, for every renderer.
 */
export function useChatLabels(): ChatLabels {
  const { _ } = useLingui();
  const { overrideLabels } = useChatState();

  return {
    title:
      overrideLabels.title ?? _(msg({ id: 'autopilot-chat.header.title', message: `Autopilot` })),
    inputPlaceholder:
      overrideLabels.inputPlaceholder ??
      _(msg({ id: 'autopilot-chat.input.placeholder', message: `Type a message...` })),
    footerDisclaimer:
      overrideLabels.footerDisclaimer ??
      _(
        msg({
          id: 'autopilot-chat.input.footer',
          message: `AI can make mistakes. Check important info.`,
        })
      ),
  };
}
