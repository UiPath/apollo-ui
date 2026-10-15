import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AutopilotChatEvent, AutopilotChatService } from '../../service';
import { AutopilotChatServiceProvider } from '../providers/chat-service.provider';
import { AutopilotChatStateProvider } from '../providers/chat-state-provider';
import { AutopilotLoadingProvider } from '../providers/loading-provider';
import { AutopilotStreamingProvider } from '../providers/streaming-provider';
import { useComposerSend } from './use-composer-send';

let instanceCounter = 0;
let composer: ReturnType<typeof useComposerSend> | undefined;

function Probe() {
  composer = useComposerSend();
  return null;
}

function setup() {
  const service = AutopilotChatService.Instantiate({ instanceName: `send-${++instanceCounter}` });
  const events: string[] = [];
  for (const event of [
    AutopilotChatEvent.SpeechToTextToggle,
    AutopilotChatEvent.Request,
    AutopilotChatEvent.StopResponse,
  ]) {
    service.on(event, () => events.push(event));
  }
  render(
    <AutopilotChatServiceProvider chatServiceInstance={service}>
      <AutopilotStreamingProvider>
        <AutopilotChatStateProvider>
          <AutopilotLoadingProvider>
            <Probe />
          </AutopilotLoadingProvider>
        </AutopilotChatStateProvider>
      </AutopilotStreamingProvider>
    </AutopilotChatServiceProvider>
  );
  return { service, events };
}

describe('useComposerSend', () => {
  it('ends dictation before sending', async () => {
    const { service, events } = setup();
    service.setSpeechToTextState(true);

    // Request reaches listeners after the interceptors, a tick later.
    await act(async () => composer?.send('Hi', []));

    expect(events).toEqual([AutopilotChatEvent.SpeechToTextToggle, AutopilotChatEvent.Request]);
    expect(service.isSpeechToTextActive).toBe(false);
  });

  it('stops a reply without touching dictation', () => {
    const { service, events } = setup();
    act(() => service.setWaiting(true));
    service.setSpeechToTextState(true);

    expect(composer?.canStopResponse).toBe(true);
    act(() => composer?.stop());

    expect(events).toEqual([AutopilotChatEvent.StopResponse]);
    expect(service.isSpeechToTextActive).toBe(true);
  });
});
