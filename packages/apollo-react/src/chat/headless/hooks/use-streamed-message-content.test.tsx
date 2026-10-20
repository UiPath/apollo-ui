import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type AutopilotChatMessage, AutopilotChatService } from '../../service';
import { AutopilotChatServiceProvider } from '../providers/chat-service.provider';
import { AutopilotStreamingProvider } from '../providers/streaming-provider';
import { useStreamedMessageContent } from './use-streamed-message-content';

let instanceCounter = 0;
let latest: ReturnType<typeof useStreamedMessageContent> | undefined;

function Probe({ message }: { message: AutopilotChatMessage }) {
  latest = useStreamedMessageContent(message);
  return null;
}

const reply = (extra: Partial<AutopilotChatMessage> = {}) => ({
  widget: 'apollo-markdown-renderer',
  created_at: '',
  ...extra,
});

function setup(first: Partial<AutopilotChatMessage>) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `streamed-content-${++instanceCounter}`,
  });
  service.sendResponse(reply(first));
  const message = service.getConversation()[0] as AutopilotChatMessage;
  render(
    <AutopilotChatServiceProvider chatServiceInstance={service}>
      <AutopilotStreamingProvider>
        <Probe message={message} />
      </AutopilotStreamingProvider>
    </AutopilotChatServiceProvider>
  );
  return service;
}

describe('useStreamedMessageContent', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders content parts as citation markup', () => {
    setup({
      id: 'p1',
      content: 'Sky',
      contentParts: [{ text: 'Sky', citations: [{ id: 1, title: 'Web', url: 'https://a.test' }] }],
    });

    expect(latest?.content).toMatch(/^\[\[cite-start:.+\]\]Sky\[\[cite-end\]\]$/);
  });

  it('holds back a resource token until it closes, and flushes on done', () => {
    const now = vi.spyOn(Date, 'now');
    const service = setup({ id: 's1', content: 'Use ', stream: true });

    now.mockReturnValue(1_000);
    act(() =>
      service.sendResponse(
        reply({ id: 's1', content: 'the [[resource-token:{"id":', stream: true })
      )
    );
    expect(latest?.content).toBe('Use the ');

    now.mockReturnValue(2_000);
    act(() =>
      service.sendResponse(
        reply({ id: 's1', content: '"a","type":"v","displayName":"A"}]] now', stream: true })
      )
    );
    expect(latest?.content).toBe(
      'Use the [[resource-token:{"id":"a","type":"v","displayName":"A"}]] now'
    );

    // Within 50ms of the last update a chunk waits; the closing chunk flushes it.
    act(() => service.sendResponse(reply({ id: 's1', content: ' and', stream: true })));
    expect(latest?.content).toMatch(/now$/);
    act(() =>
      service.sendResponse(reply({ id: 's1', content: ' done', stream: true, done: true }))
    );
    expect(latest?.content).toMatch(/now and done$/);
  });

  it('reveals a fake stream a few characters at a time', () => {
    vi.useFakeTimers();
    setup({ id: 'f1', content: 'A fake streamed reply', fakeStream: true });

    expect(latest).toEqual({ content: '', fakeStreaming: true });
    act(() => vi.advanceTimersByTime(50));
    expect(latest?.content).toBe('A fake str');
    act(() => vi.advanceTimersByTime(200));
    expect(latest).toEqual({ content: 'A fake streamed reply', fakeStreaming: false });
  });

  it('shows the whole reply and stops revealing when the response is stopped', () => {
    vi.useFakeTimers();
    const clearInterval = vi.spyOn(globalThis, 'clearInterval');
    const service = setup({ id: 'f2', content: 'A fake streamed reply', fakeStream: true });
    act(() => vi.advanceTimersByTime(50));
    expect(latest?.content).toBe('A fake str');

    act(() => service.stopResponse());

    expect(latest).toEqual({ content: 'A fake streamed reply', fakeStreaming: false });
    expect(clearInterval).toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(500));
    expect(latest?.content).toBe('A fake streamed reply');
  });
});
