import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  type AutopilotChatMessage,
  AutopilotChatRole,
  AutopilotChatService,
  DEFAULT_MESSAGE_RENDERER,
} from '../../service';
import { AutopilotChatServiceProvider } from '../providers/chat-service.provider';
import { AutopilotChatStateProvider } from '../providers/chat-state-provider';
import { useChatMessages } from './use-chat-messages';

let instanceCounter = 0;

const message = (id: string, role: AutopilotChatRole): AutopilotChatMessage => ({
  id,
  role,
  content: id,
  created_at: new Date().toISOString(),
  widget: DEFAULT_MESSAGE_RENDERER,
});

describe('useChatMessages', () => {
  it('picks up a conversation the host set after the transcript rendered but before it subscribed', () => {
    const service = AutopilotChatService.Instantiate({
      instanceName: `use-chat-messages-${++instanceCounter}`,
    });
    let seen: AutopilotChatMessage[] = [];
    let set = false;

    function Probe() {
      seen = useChatMessages().messages;
      return null;
    }
    // Renders after Probe and before effects run, as a host call can land while React holds a
    // Suspense reveal back.
    function HostSets() {
      if (!set) {
        set = true;
        service.setConversation([
          message('question', AutopilotChatRole.User),
          message('answer', AutopilotChatRole.Assistant),
        ]);
      }
      return null;
    }

    render(
      <AutopilotChatServiceProvider chatServiceInstance={service}>
        <AutopilotChatStateProvider>
          <Probe />
          <HostSets />
        </AutopilotChatStateProvider>
      </AutopilotChatServiceProvider>
    );

    expect(seen.map((item) => item.id)).toEqual(['question', 'answer']);
  });
});
