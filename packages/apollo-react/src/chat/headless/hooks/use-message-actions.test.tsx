import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { type AutopilotChatMessage, AutopilotChatRole, AutopilotChatService } from '../../service';
import { AutopilotChatServiceProvider } from '../providers/chat-service.provider';
import { useIsLastAssistantMessage } from './use-message-actions';

let instanceCounter = 0;

const assistant = (
  id: string,
  extra: Partial<AutopilotChatMessage> = {}
): AutopilotChatMessage => ({
  id,
  content: id,
  created_at: '',
  role: AutopilotChatRole.Assistant,
  widget: 'apollo-markdown-renderer',
  ...extra,
});

function setup(conversation: AutopilotChatMessage[]) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `latest-reply-${++instanceCounter}`,
  });
  service.setConversation(conversation);
  const latest: Record<string, boolean> = {};
  const Probe = ({ message }: { message: AutopilotChatMessage }) => {
    latest[message.id] = useIsLastAssistantMessage(message);
    return null;
  };
  render(
    <AutopilotChatServiceProvider chatServiceInstance={service}>
      {conversation.map((message) => (
        <Probe key={message.id} message={message} />
      ))}
    </AutopilotChatServiceProvider>
  );
  return { service, latest };
}

describe('useIsLastAssistantMessage', () => {
  it('marks only the latest reply in a transcript without groupIds', () => {
    const { latest } = setup([assistant('a1'), assistant('a2'), assistant('a3')]);

    expect(latest).toEqual({ a1: false, a2: false, a3: true });
  });

  it('keeps the latest reply when an older one is re-sent with feedback', () => {
    const { service, latest } = setup([assistant('a1'), assistant('a2')]);

    act(() => service.sendResponse({ ...assistant('a1'), feedback: { isPositive: true } }));

    expect(latest).toEqual({ a1: false, a2: true });
  });

  it('counts the messages of the latest reply group', () => {
    const { latest } = setup([
      assistant('a1', { groupId: 'g1' }),
      assistant('b1', { groupId: 'g2' }),
      assistant('b2', { groupId: 'g2' }),
    ]);

    expect(latest).toEqual({ a1: false, b1: true, b2: true });
  });
});
