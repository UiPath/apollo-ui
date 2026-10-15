import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { type AutopilotChatMessage, AutopilotChatRole, AutopilotChatService } from '../../service';
import { AutopilotChatServiceProvider } from '../providers/chat-service.provider';
import { useSettledReplies } from './use-settled-replies';

let instanceCounter = 0;

function setup(restored: AutopilotChatMessage[] = []) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `settled-${++instanceCounter}`,
  });
  service.setConversation(restored);
  const settled = vi.fn();
  const Probe = () => {
    useSettledReplies(settled);
    return null;
  };
  render(
    <AutopilotChatServiceProvider chatServiceInstance={service}>
      <Probe />
    </AutopilotChatServiceProvider>
  );
  return { service, settled };
}

const reply = (extra: Partial<AutopilotChatMessage> = {}) => ({
  widget: 'apollo-markdown-renderer',
  created_at: '',
  ...extra,
});

describe('useSettledReplies', () => {
  it('reports a complete reply once, even when it is re-sent with feedback', () => {
    const { service, settled } = setup();

    act(() => service.sendResponse(reply({ id: 'r1', content: 'done' })));
    act(() =>
      service.sendResponse(reply({ id: 'r1', content: 'done', feedback: { isPositive: true } }))
    );

    expect(settled).toHaveBeenCalledTimes(1);
  });

  it('reports a streamed reply when its last chunk arrives', () => {
    const { service, settled } = setup();

    act(() => service.sendResponse(reply({ id: 's1', content: 'a', stream: true })));
    act(() => service.sendResponse(reply({ id: 's1', content: 'b', stream: true })));
    expect(settled).not.toHaveBeenCalled();

    act(() => service.sendResponse(reply({ id: 's1', content: '', stream: true, done: true })));

    expect(settled).toHaveBeenCalledTimes(1);
    expect(settled.mock.calls[0]?.[0]).toMatchObject({
      id: 's1',
      role: AutopilotChatRole.Assistant,
    });
  });

  it('reports a stopped stream once', () => {
    const { service, settled } = setup();

    act(() => service.sendResponse(reply({ id: 's2', content: 'a', stream: true })));
    act(() => service.stopResponse());

    expect(settled).toHaveBeenCalledTimes(1);
  });

  it('ignores restored conversations and user turns', () => {
    const { service, settled } = setup();

    act(() =>
      service.setConversation([
        {
          id: 'old',
          content: 'old',
          created_at: '',
          role: AutopilotChatRole.Assistant,
          widget: '',
        },
      ])
    );
    act(() => service.sendRequest({ content: 'hi' }));

    expect(settled).not.toHaveBeenCalled();
  });

  it('does not report a restored reply when it is re-sent with feedback', () => {
    const restored = {
      id: 'old',
      content: 'old',
      created_at: '',
      role: AutopilotChatRole.Assistant,
      widget: 'apollo-markdown-renderer',
    };
    const { service, settled } = setup([restored]);

    act(() => service.sendResponse({ ...restored, feedback: { isPositive: true } }));

    expect(settled).not.toHaveBeenCalled();
  });

  it('does not report a reply restored after mount when it is re-sent', () => {
    const { service, settled } = setup();
    const restored = {
      id: 'later',
      content: 'later',
      created_at: '',
      role: AutopilotChatRole.Assistant,
      widget: 'apollo-markdown-renderer',
    };

    act(() => service.setConversation([restored]));
    act(() => service.sendResponse({ ...restored, feedback: { isPositive: false } }));

    expect(settled).not.toHaveBeenCalled();
  });
});
