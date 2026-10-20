import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AutopilotChatMode, AutopilotChatService } from '../../service';
import { AutopilotChatScrollProvider, useChatScroll } from './chat-scroll-provider';
import { AutopilotChatServiceProvider } from './chat-service.provider';
import { AutopilotStreamingProvider } from './streaming-provider';

let instanceCounter = 0;
let autoScrollValue: boolean | undefined;

function Probe() {
  autoScrollValue = useChatScroll().autoScroll;
  return null;
}

// No scroll container is registered: the state must hold before a renderer mounts one.
function setup() {
  const service = AutopilotChatService.Instantiate({
    instanceName: `scroll-provider-${++instanceCounter}`,
    config: { mode: AutopilotChatMode.Embedded },
  });
  render(
    <AutopilotChatServiceProvider chatServiceInstance={service}>
      <AutopilotStreamingProvider>
        <AutopilotChatScrollProvider>
          <Probe />
        </AutopilotChatScrollProvider>
      </AutopilotStreamingProvider>
    </AutopilotChatServiceProvider>
  );

  return service;
}

describe('AutopilotChatScrollProvider', () => {
  it('follows the service auto-scroll toggle before a scroll container exists', () => {
    const service = setup();
    expect(autoScrollValue).toBe(true);

    act(() => service.toggleAutoScroll(false));

    expect(autoScrollValue).toBe(false);
  });

  it('switches following back on for a new turn, a new chat or an opened conversation', async () => {
    const service = setup();

    act(() => service.toggleAutoScroll(false));
    await act(async () => {
      service.sendRequest({ content: 'hi' });
    });
    expect(autoScrollValue).toBe(true);

    act(() => service.toggleAutoScroll(false));
    act(() => service.newChat());
    expect(autoScrollValue).toBe(true);

    act(() => service.toggleAutoScroll(false));
    act(() => service.openConversation('c1'));
    expect(autoScrollValue).toBe(true);
  });
});
